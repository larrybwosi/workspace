package com.scrymechat.android.ui.notifications

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.entities.NotificationEntity
import com.scrymechat.android.data.repository.NotificationRepository
import com.scrymechat.android.data.repository.RealtimeRepository
import com.scrymechat.android.notifications.NotificationHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val repository: NotificationRepository,
    private val realtimeRepository: RealtimeRepository,
    private val sessionManager: SessionManager,
    private val friendsRepository: com.scrymechat.android.data.repository.FriendsRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationsUiState())
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    init {
        observeNotifications()
        observeRealtimeNotifications()
        refreshNotifications()
    }

    private fun observeRealtimeNotifications() {
        viewModelScope.launch {
            realtimeRepository.observeNotifications().collect { dto ->
                try {
                    repository.saveNotification(dto)
                    val dataMap = mutableMapOf<String, String>(
                        "title" to dto.title,
                        "body" to dto.message,
                        "type" to dto.type
                    )
                    dto.entityId?.let { dataMap["entityId"] = it }
                    dto.entityType?.let { dataMap["entityType"] = it }
                    NotificationHelper(context).showNotification(dataMap)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    private fun observeNotifications() {
        repository.getNotificationsFlow().onEach { notifications ->
            _uiState.update { it.copy(notifications = notifications) }
        }.launchIn(viewModelScope)
    }

    fun getNotificationById(id: String): Flow<NotificationEntity?> {
        return repository.getNotificationByIdFlow(id)
    }

    fun refreshNotifications() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = repository.fetchNotifications()
            if (result is Resource.Error) {
                _uiState.update { it.copy(error = result.message, isLoading = false) }
            } else {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun markAsRead(notificationId: String) {
        viewModelScope.launch {
            repository.markAsRead(notificationId)
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            val userId = sessionManager.getActiveSession()?.userId ?: return@launch
            repository.markAllRead(userId)
        }
    }

    fun acceptFriendRequest(requestId: String, notificationId: String) {
        viewModelScope.launch {
            friendsRepository.updateFriendRequest(requestId, "accept")
            repository.markAsRead(notificationId)
            refreshNotifications()
        }
    }

    fun declineFriendRequest(requestId: String, notificationId: String) {
        viewModelScope.launch {
            friendsRepository.updateFriendRequest(requestId, "decline")
            repository.markAsRead(notificationId)
            refreshNotifications()
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}

data class NotificationsUiState(
    val notifications: List<NotificationEntity> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
