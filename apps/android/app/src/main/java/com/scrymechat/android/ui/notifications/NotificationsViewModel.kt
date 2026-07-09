package com.scrymechat.android.ui.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.entities.NotificationEntity
import com.scrymechat.android.data.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val repository: NotificationRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationsUiState())
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    init {
        observeNotifications()
        refreshNotifications()
    }

    private fun observeNotifications() {
        repository.getNotificationsFlow().onEach { notifications ->
            _uiState.update { it.copy(notifications = notifications) }
        }.launchIn(viewModelScope)
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

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}

data class NotificationsUiState(
    val notifications: List<NotificationEntity> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
