package com.scrymechat.android.ui.signup

import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.messaging.FirebaseMessaging
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.remote.RealtimeService
import com.scrymechat.android.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SignUpUiState(
    val name: String = "",
    val username: String = "",
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSignUpSuccess: Boolean = false
)

@HiltViewModel
class SignUpViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager,
    @dagger.hilt.android.qualifiers.ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(SignUpUiState())
    val uiState: StateFlow<SignUpUiState> = _uiState.asStateFlow()

    fun onNameChanged(name: String) {
        _uiState.update { it.copy(name = name, error = null) }
    }

    fun onUsernameChanged(username: String) {
        _uiState.update { it.copy(username = username, error = null) }
    }

    fun onEmailChanged(email: String) {
        _uiState.update { it.copy(email = email, error = null) }
    }

    fun onPasswordChanged(password: String) {
        _uiState.update { it.copy(password = password, error = null) }
    }

    fun signUp() {
        val state = _uiState.value
        if (state.name.isBlank() || state.username.isBlank() || state.email.isBlank() || state.password.isBlank()) {
            _uiState.update { it.copy(error = "All fields are required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = authRepository.signup(state.email, state.password, state.name, state.username)
            if (result.isSuccess) {
                try {
                    registerFcmToken()
                } catch (e: Exception) {
                    Log.e("SignUpViewModel", "FCM not available", e)
                }
                try {
                    startRealtimeService()
                } catch (e: Exception) {
                    Log.e("SignUpViewModel", "Service not available", e)
                }
                _uiState.update { it.copy(isLoading = false, isSignUpSuccess = true) }
            } else {
                _uiState.update { it.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Sign up failed") }
            }
        }
    }

    private fun startRealtimeService() {
        val intent = Intent(context, RealtimeService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
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
                    } catch (e: Exception) {
                        Log.e("SignUpViewModel", "Failed to register FCM Token", e)
                    }
                }
            }
        }
    }
}
