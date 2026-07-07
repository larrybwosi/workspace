package com.scrymechat.android.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.dao.UserDao
import com.scrymechat.android.data.repository.AuthRepository
import com.scrymechat.android.data.repository.StorageRepository
import com.scrymechat.android.data.remote.AuthApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val storageRepository: StorageRepository,
    private val authApi: AuthApi,
    private val sessionManager: SessionManager,
    private val userDao: UserDao
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private val _errorEvents = MutableSharedFlow<String>(extraBufferCapacity = 1)
    val errorEvents = _errorEvents.asSharedFlow()

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

    fun updateProfile(updates: Map<String, Any>) {
        viewModelScope.launch {
            try {
                val response = authApi.updateMe(updates)
                if (response.isSuccessful) {
                    val userResponse = authApi.getMe()
                    if (userResponse.isSuccessful) {
                        val body = userResponse.body()
                        val currentUser = _uiState.value.currentUser
                        if (currentUser != null && body != null) {
                            val updatedUser = currentUser.copy(
                                name = body.name,
                                username = body.username ?: currentUser.username,
                                avatar = body.avatar ?: body.image ?: currentUser.avatar,
                                banner = body.banner ?: currentUser.banner,
                                statusText = body.statusText ?: currentUser.statusText
                            )
                            userDao.insertUser(updatedUser)
                        }
                    } else {
                        _errorEvents.tryEmit("Failed to sync profile: ${userResponse.code()}")
                    }
                } else {
                    _errorEvents.tryEmit("Failed to update profile: ${response.code()}")
                }
            } catch (e: Exception) {
                _errorEvents.tryEmit("Error updating profile: ${e.localizedMessage}")
            }
        }
    }

    fun uploadImage(file: File, type: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUploading = true) }
            val result = storageRepository.uploadFile(file)
            _uiState.update { it.copy(isUploading = false) }

            result.onSuccess { response ->
                updateProfile(mapOf(type to response.url))
            }.onFailure { e ->
                _errorEvents.tryEmit("Upload failed: ${e.localizedMessage}")
            }
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

    private val _targetUser = MutableStateFlow<UserEntity?>(null)
    val targetUser: StateFlow<UserEntity?> = _targetUser.asStateFlow()

    private val _isLoadingTarget = MutableStateFlow(false)
    val isLoadingTarget: StateFlow<Boolean> = _isLoadingTarget.asStateFlow()

    fun fetchUser(userId: String) {
        viewModelScope.launch {
            _isLoadingTarget.value = true
            try {
                val response = authApi.getUser(userId)
                if (response.isSuccessful) {
                    val userDto = response.body()
                    if (userDto != null) {
                        _targetUser.value = UserEntity(
                            id = userDto.id,
                            name = userDto.name,
                            username = userDto.username,
                            email = "", // Private info
                            avatar = userDto.avatar,
                            banner = userDto.banner,
                            statusText = userDto.statusText,
                            statusEmoji = userDto.statusEmoji,
                            bio = userDto.bio,
                            role = userDto.role ?: "member",
                            status = userDto.status ?: "offline"
                        )
                    }
                }
            } catch (e: Exception) {
                _errorEvents.tryEmit("Error fetching user: ${e.localizedMessage}")
            } finally {
                _isLoadingTarget.value = false
            }
        }
    }
}

data class ProfileUiState(
    val currentUser: UserEntity? = null,
    val isLoggedOut: Boolean = false,
    val isAuthorizingQR: Boolean = false,
    val isUploading: Boolean = false
)
