package com.scrymechat.android.ui.login

import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.data.remote.RealtimeService
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
open class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager,
    @dagger.hilt.android.qualifiers.ApplicationContext private val context: Context
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
            if (result.isSuccess) {
                try {
                    registerFcmToken()
                } catch (e: Exception) {
                    Log.e("LoginViewModel", "FCM not available", e)
                }
                try {
                    startRealtimeService()
                } catch (e: Exception) {
                    Log.e("LoginViewModel", "Service not available", e)
                }
                _uiState.update { it.copy(isLoading = false, isLoginSuccess = true) }
            } else {
                val error = result.exceptionOrNull()
                _uiState.update { it.copy(isLoading = false, error = error?.message ?: "Unknown error") }
            }
        }
    }

    protected open fun startRealtimeService() {
        val intent = Intent(context, RealtimeService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    protected open fun registerFcmToken() {
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
