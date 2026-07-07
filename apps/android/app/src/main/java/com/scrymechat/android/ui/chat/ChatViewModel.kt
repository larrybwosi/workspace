package com.scrymechat.android.ui.chat

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import android.provider.OpenableColumns
import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.entities.MessageEntity
import com.scrymechat.android.data.remote.*
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
    private var currentThreadId: String? = null
    private var currentWorkspaceSlug: String? = null

    init {
        observeRealtimeMessages()
        observeTypingStatus()
    }

    fun setWorkspaceSlug(slug: String) {
        currentWorkspaceSlug = slug
    }

    fun setChannel(channelId: String) {
        if (currentChannelId == channelId && currentThreadId == null) return

        currentChannelId?.let { realtimeRepository.leaveRoom("channel:$it") }
        currentThreadId?.let { realtimeRepository.leaveRoom("thread:$it") }
        currentChannelId = channelId
        currentDmId = null
        currentThreadId = null

        _uiState.update { it.copy(isThread = false, threadRootMessage = null) }

        realtimeRepository.joinRoom("channel:$channelId")
        loadMessages()
    }

    fun setThread(channelId: String, message: MessageEntity) {
        val threadId = message.id
        if (currentThreadId == threadId) return

        currentChannelId?.let { realtimeRepository.leaveRoom("channel:$it") }
        currentThreadId?.let { realtimeRepository.leaveRoom("thread:$it") }

        currentChannelId = channelId
        currentThreadId = threadId
        currentDmId = null

        _uiState.update { it.copy(isThread = true, threadRootMessage = message) }

        realtimeRepository.joinRoom("thread:$threadId")
        loadMessages()
    }

    fun setDm(dmId: String) {
        if (currentDmId == dmId) return

        currentDmId?.let { realtimeRepository.leaveRoom("dm:$it") }
        currentDmId = dmId
        currentChannelId = null

        realtimeRepository.joinRoom("dm:$dmId")
        loadMessages()
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
        val threadId = currentThreadId
        val slug = currentWorkspaceSlug

        viewModelScope.launch {
            when {
                threadId != null && channelId != null && slug != null -> chatRepository.getThreadMessages(slug, channelId, threadId).collect { resource ->
                    if (resource is Resource.Error) _uiState.update { it.copy(error = resource.message) }
                }
                channelId != null && slug != null -> chatRepository.getChannelMessages(slug, channelId).collect { resource ->
                    if (resource is Resource.Error) _uiState.update { it.copy(error = resource.message) }
                }
                dmId != null -> chatRepository.getDmMessages(dmId).collect { resource ->
                    if (resource is Resource.Error) _uiState.update { it.copy(error = resource.message) }
                }
            }
        }

        viewModelScope.launch {
            val flow = when {
                threadId != null -> chatRepository.getThreadMessagesFlow(threadId)
                channelId != null -> chatRepository.getChannelMessagesFlow(channelId)
                dmId != null -> chatRepository.getDmMessagesFlow(dmId)
                else -> return@launch
            }

            flow.collect { messages ->
                _uiState.update { it.copy(messages = messages, isLoading = false) }
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

    fun uploadFile(uri: Uri, context: Context) {
        viewModelScope.launch {
            try {
                var fileName = "file"
                var fileSize = 0L
                context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                    val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                    if (cursor.moveToFirst()) {
                        fileName = cursor.getString(nameIndex)
                        fileSize = cursor.getLong(sizeIndex)
                    }
                }

                val inputStream = context.contentResolver.openInputStream(uri) ?: return@launch
                val tempFile = java.io.File.createTempFile("upload", null, context.cacheDir)
                tempFile.outputStream().use { outputStream ->
                    inputStream.copyTo(outputStream)
                }

                val result = storageRepository.uploadFile(tempFile)
                if (result.isSuccess) {
                    val uploadResponse = result.getOrThrow()
                    val attachment = CreateAttachmentRequest(
                        name = uploadResponse.name,
                        type = uploadResponse.type,
                        url = uploadResponse.url,
                        size = uploadResponse.size.toInt()
                    )
                    _uiState.update { it.copy(pendingAttachments = it.pendingAttachments + attachment) }
                } else {
                    _uiState.update { it.copy(error = result.exceptionOrNull()?.message ?: "Upload failed") }
                }
                tempFile.delete()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "An error occurred during upload") }
            }
        }
    }

    fun removePendingAttachment(attachment: CreateAttachmentRequest) {
        _uiState.update { it.copy(pendingAttachments = it.pendingAttachments - attachment) }
    }

    fun onBack() {
        currentChannelId?.let { setChannel(it) }
    }

    fun sendMessage(content: String, replyToId: String? = null, targetChannelId: String? = null, attachments: List<CreateAttachmentRequest>? = null) {
        val channelId = targetChannelId ?: currentChannelId
        val dmId = currentDmId
        val threadId = currentThreadId
        val slug = currentWorkspaceSlug
        val finalAttachments = attachments ?: _uiState.value.pendingAttachments

        viewModelScope.launch {
            val result = when {
                threadId != null && channelId != null && slug != null -> chatRepository.sendThreadMessage(slug, channelId, threadId, content, finalAttachments)
                channelId != null && slug != null -> chatRepository.sendChannelMessage(slug, channelId, content, replyToId, finalAttachments)
                dmId != null -> chatRepository.sendDmMessage(dmId, content, replyToId, finalAttachments)
                else -> return@launch
            }

            if (result is Resource.Error) {
                _uiState.update { it.copy(error = result.message) }
            } else {
                _uiState.update { it.copy(pendingAttachments = emptyList()) }
            }
        }
    }

    private fun observeRealtimeMessages() {
        viewModelScope.launch {
            realtimeRepository.observeMessages().collect { messageDto ->
                val channelId = currentChannelId
                val dmId = currentDmId
                val threadId = currentThreadId

                val isRelevant = when {
                    threadId != null -> messageDto.threadId == threadId
                    channelId != null -> messageDto.channelId == channelId && messageDto.threadId == null
                    dmId != null -> messageDto.dmId == dmId
                    else -> false
                }

                if (isRelevant) {
                    // Update local messages
                    loadMessages()
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
        if (action.id == "add_reaction") {
            val emoji = formState["emoji"] as? String ?: return
            toggleReaction(message.id, emoji)
            return
        }

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

    fun toggleReaction(messageId: String, emoji: String) {
        val channelId = currentChannelId
        val dmId = currentDmId
        val slug = currentWorkspaceSlug

        viewModelScope.launch {
            val result = if (channelId != null) {
                chatRepository.addReaction(slug, channelId, messageId, emoji, true)
            } else if (dmId != null) {
                chatRepository.addReaction(null, dmId, messageId, emoji, false)
            } else return@launch

            if (result is Resource.Error) {
                _uiState.update { it.copy(error = result.message) }
            } else {
                loadMessages() // Refresh to show reaction
            }
        }
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
    val isThread: Boolean = false,
    val threadRootMessage: MessageEntity? = null,
    val pendingAttachments: List<CreateAttachmentRequest> = emptyList()
)

data class ModalState(
    val messageId: String,
    val customMessage: com.scrymechat.android.data.remote.CustomMessageDto
)
