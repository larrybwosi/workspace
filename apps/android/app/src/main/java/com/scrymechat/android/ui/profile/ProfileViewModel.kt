package com.scrymechat.android.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        sessionManager.getActiveSessionFlow()
            .flatMapLatest { session ->
                if (session != null) {
                    sessionManager.getUserFlow(session.userId)
                } else {
                    flowOf(null)
                }
            }
            .onEach { user ->
                _uiState.update { it.copy(currentUser = user) }
            }
            .launchIn(viewModelScope)
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.update { it.copy(isLoggedOut = true) }
        }
    }

    fun authorizeQR(sessionId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isAuthorizingQR = true) }
            val result = authRepository.authorizeQR(sessionId)
            _uiState.update { it.copy(isAuthorizingQR = false) }

            result.onSuccess {
                onSuccess()
            }.onFailure {
                onError(it.message ?: "Unknown error")
            }
        }
    }
}

data class ProfileUiState(
    val currentUser: UserEntity? = null,
    val isLoggedOut: Boolean = false,
    val isAuthorizingQR: Boolean = false
)
