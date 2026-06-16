package com.scrymechat.android.ui.login

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.messaging.FirebaseMessaging
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChanged(email: String) {
        _uiState.update { it.copy(email = email, error = null) }
    }

    fun onPasswordChanged(password: String) {
        _uiState.update { it.copy(password = password, error = null) }
    }

    fun login() {
        val email = _uiState.value.email
        val password = _uiState.value.password

        if (email.isBlank() || password.isBlank()) {
            _uiState.update { it.copy(error = "Email and password cannot be empty") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = authRepository.login(email, password)
            _uiState.update { state ->
                result.fold(
                    onSuccess = {
                        registerFcmToken()
                        state.copy(isLoading = false, isLoginSuccess = true)
                    },
                    onFailure = { error -> state.copy(isLoading = false, error = error.message) }
                )
            }
        }
    }

    private fun registerFcmToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                sessionManager.saveFcmToken(token)
                viewModelScope.launch {
                    try {
                        authRepository.registerDeviceToken(token, "android")
                        Log.d("LoginViewModel", "FCM Token registered successfully")
                    } catch (e: Exception) {
                        Log.e("LoginViewModel", "Failed to register FCM Token", e)
                    }
                }
            } else {
                Log.w("LoginViewModel", "Fetching FCM registration token failed", task.exception)
            }
        }
    }
}

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoginSuccess: Boolean = false
)
