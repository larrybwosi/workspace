package com.scrymechat.android.ui.chat

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.entities.MessageEntity
import com.scrymechat.android.data.remote.MessageActionDto
import com.scrymechat.android.data.repository.ChatRepository
import com.scrymechat.android.data.repository.RealtimeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val realtimeRepository: RealtimeRepository,
    private val dmRepository: com.scrymechat.android.data.repository.DmRepository,
    private val storageRepository: com.scrymechat.android.data.repository.StorageRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private val _formStates = MutableStateFlow<Map<String, Map<String, Any>>>(emptyMap())
    val formStates: StateFlow<Map<String, Map<String, Any>>> = _formStates.asStateFlow()

    private val _loadingActions = MutableStateFlow<Set<String>>(emptySet())
    val loadingActions: StateFlow<Set<String>> = _loadingActions.asStateFlow()

    private var currentChannelId: String? = null
    private var currentDmId: String? = null
    private var currentWorkspaceSlug: String? = null

    init {
        observeRealtimeMessages()
        observeTypingStatus()
        observePresence()
    }

    fun setWorkspaceSlug(slug: String) {
        currentWorkspaceSlug = slug
    }

    fun setChannel(channelId: String) {
        if (currentChannelId == channelId) return

        currentChannelId?.let { realtimeRepository.leaveRoom("channel:$it") }
        currentChannelId = channelId
        currentDmId = null

        realtimeRepository.joinRoom("channel:$channelId")
        loadMessages()
        markAsRead()
    }

    fun setDm(dmId: String) {
        if (currentDmId == dmId) return

        currentDmId?.let { realtimeRepository.leaveRoom("dm:$it") }
        currentDmId = dmId
        currentChannelId = null

        realtimeRepository.joinRoom("dm:$dmId")
        loadMessages()
        markAsRead()
    }

    private fun markAsRead() {
        val channelId = currentChannelId
        val dmId = currentDmId
        viewModelScope.launch {
            when {
                channelId != null -> chatRepository.markMessagesAsRead(channelId, true)
                dmId != null -> chatRepository.markMessagesAsRead(dmId, false)
            }
        }
    }

    fun setDmByUser(userId: String) {
        viewModelScope.launch {
            val result = dmRepository.createDm(userId)
            if (result is Resource.Success && result.data != null) {
                setDm(result.data.id)
            } else if (result is Resource.Error) {
                _uiState.update { it.copy(error = result.message) }
            }
        }
    }

    private fun loadMessages() {
        val channelId = currentChannelId
        val dmId = currentDmId

        viewModelScope.launch {
            when {
                channelId != null -> chatRepository.getChannelMessages(channelId).collect { resource ->
                    if (resource is Resource.Error) _uiState.update { it.copy(error = resource.message) }
                }
                dmId != null -> chatRepository.getDmMessages(dmId).collect { resource ->
                    if (resource is Resource.Error) _uiState.update { it.copy(error = resource.message) }
                }
            }
        }

        viewModelScope.launch {
            val flow = when {
                channelId != null -> chatRepository.getChannelMessagesFlow(channelId)
                dmId != null -> chatRepository.getDmMessagesFlow(dmId)
                else -> return@launch
            }

            flow.collect { messages ->
                _uiState.update { it.copy(messages = messages, isLoading = false) }
            }
        }
    }

    private fun observePresence() {
        viewModelScope.launch {
            realtimeRepository.observePresence().collect { presence ->
                val dmId = currentDmId
                if (dmId != null) {
                    val dm = dmRepository.getDms().first().data?.find { it.id == dmId }
                    if (dm?.otherUserId == presence.userId) {
                        _uiState.update { it.copy(otherUserPresence = presence.data?.get("status") as? String ?: "online") }
                    }
                }
            }
        }
    }

    private fun observeTypingStatus() {
        viewModelScope.launch {
            realtimeRepository.observeTyping().collect { event ->
                val room = when {
                    currentChannelId != null -> "channel:$currentChannelId"
                    currentDmId != null -> "dm:$currentDmId"
                    else -> null
                }

                if (event.room == room) {
                    _uiState.update { state ->
                        val newList = (state.typingUsers + event.userName).distinct()
                        state.copy(typingUsers = newList)
                    }
                    // Remove after 3 seconds
                    viewModelScope.launch {
                        kotlinx.coroutines.delay(3000)
                        _uiState.update { state ->
                            state.copy(typingUsers = state.typingUsers - event.userName)
                        }
                    }
                }
            }
        }
    }

    fun sendMessage(content: String, replyToId: String? = null, targetChannelId: String? = null) {
        val channelId = targetChannelId ?: currentChannelId
        val dmId = currentDmId

        viewModelScope.launch {
            val result = when {
                channelId != null -> chatRepository.sendChannelMessage(channelId, content, replyToId)
                dmId != null -> chatRepository.sendDmMessage(dmId, content, replyToId)
                else -> return@launch
            }

            if (result is Resource.Error) {
                _uiState.update { it.copy(error = result.message) }
            }
        }
    }

    private fun observeRealtimeMessages() {
        viewModelScope.launch {
            realtimeRepository.observeMessages().collect { messageDto ->
                val channelId = currentChannelId
                val dmId = currentDmId

                if (messageDto.channelId == channelId || messageDto.dmId == dmId) {
                    // Update local messages
                    loadMessages()
                    // If we are currently in this chat, mark the new message as read
                    markAsRead()
                }
            }
        }
    }

    fun sendTyping(userId: String, userName: String) {
        val channelId = currentChannelId
        val dmId = currentDmId
        val room = when {
            channelId != null -> "channel:$channelId"
            dmId != null -> "dm:$dmId"
            else -> return
        }
        realtimeRepository.sendTyping(room, userId, userName)
    }

    fun updateFormState(messageId: String, fieldId: String, value: Any) {
        _formStates.update { current ->
            val messageForm = current[messageId]?.toMutableMap() ?: mutableMapOf()
            messageForm[fieldId] = value
            current + (messageId to messageForm)
        }
    }

    fun handleMessageAction(context: Context, message: MessageEntity, action: MessageActionDto, formState: Map<String, Any>) {
        when (action.handler.type) {
            "LINK" -> {
                action.handler.url?.let { url ->
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    context.startActivity(intent)
                }
            }
            "CALLBACK" -> {
                viewModelScope.launch {
                    val workspaceSlug = currentWorkspaceSlug ?: return@launch
                    _loadingActions.update { it + message.id }
                    try {
                        val payload = mutableMapOf<String, Any>()
                        action.handler.payload?.let { payload.putAll(it) }

                        val requestBody = mutableMapOf<String, Any>()
                        requestBody["payload"] = payload
                        if (action.handler.includeFormState) {
                            requestBody["formState"] = formState
                        }

                        val result = chatRepository.triggerAction(workspaceSlug, message.id, action.id, requestBody)
                        if (result is Resource.Error) {
                            _uiState.update { it.copy(error = result.message) }
                        }
                    } finally {
                        _loadingActions.update { it - message.id }
                    }
                }
            }
            "MODAL" -> {
                val customMessage = message.customMessage ?: return
                _uiState.update { it.copy(activeModal = ModalState(message.id, customMessage)) }
            }
        }
    }

    fun dismissModal() {
        _uiState.update { it.copy(activeModal = null) }
    }

    fun downloadAttachment(url: String, fileName: String, mimeType: String? = null) {
        storageRepository.downloadFile(url, fileName, mimeType)
    }
}

data class ChatUiState(
    val messages: List<MessageEntity> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val typingUsers: List<String> = emptyList(),
    val activeModal: ModalState? = null,
    val otherUserPresence: String? = null
)

data class ModalState(
    val messageId: String,
    val customMessage: com.scrymechat.android.data.remote.CustomMessageDto
)
