package com.scrymechat.android.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.entities.MessageEntity
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

    private var currentChannelId: String? = null
    private var currentDmId: String? = null

    init {
        observeRealtimeMessages()
        observeTypingStatus()
    }

    fun setChannel(channelId: String) {
        if (currentChannelId == channelId) return

        currentChannelId?.let { realtimeRepository.leaveRoom("channel:$it") }
        currentChannelId = channelId
        currentDmId = null

        realtimeRepository.joinRoom("channel:$channelId")
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

        viewModelScope.launch {
            val flow = when {
                channelId != null -> chatRepository.getChannelMessages(channelId)
                dmId != null -> chatRepository.getDmMessages(dmId)
                else -> return@launch
            }

            flow.collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        _uiState.update { it.copy(messages = resource.data ?: emptyList(), isLoading = false) }
                    }
                    is Resource.Error -> {
                        _uiState.update { it.copy(error = resource.message, isLoading = false) }
                    }
                    is Resource.Loading -> {
                        _uiState.update { it.copy(isLoading = true) }
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

    fun downloadAttachment(url: String, fileName: String, mimeType: String? = null) {
        storageRepository.downloadFile(url, fileName, mimeType)
    }
}

data class ChatUiState(
    val messages: List<MessageEntity> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val typingUsers: List<String> = emptyList()
)
