package com.scrymechat.android.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.dao.UserDao
import com.scrymechat.android.data.repository.AuthRepository
import com.scrymechat.android.data.repository.StorageRepository
import com.scrymechat.android.data.remote.AuthApi
import com.scrymechat.android.data.remote.SocialProfileDto
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
    private val userDao: UserDao,
    private val friendsRepository: com.scrymechat.android.data.repository.FriendsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    private val _errorEvents = MutableSharedFlow<String>(extraBufferCapacity = 1)
    val errorEvents = _errorEvents.asSharedFlow()

    private val _voiceMode = MutableStateFlow(sessionManager.getVoiceMode())
    val voiceMode: StateFlow<String> = _voiceMode.asStateFlow()

    private val _language = MutableStateFlow(sessionManager.getLanguage())
    val language: StateFlow<String> = _language.asStateFlow()

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

    fun updateVoiceMode(mode: String) {
        sessionManager.saveVoiceMode(mode)
        _voiceMode.value = mode
    }

    fun updateLanguage(language: String) {
        sessionManager.saveLanguage(language)
        _language.value = language
    }

    fun changePassword(currentPassword: String, newPassword: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                val response = authApi.changePassword(mapOf(
                    "currentPassword" to currentPassword,
                    "newPassword" to newPassword
                ))
                if (response.isSuccessful) {
                    onSuccess()
                } else {
                    _errorEvents.tryEmit("Failed to change password: ${response.code()}")
                }
            } catch (e: Exception) {
                _errorEvents.tryEmit("Error changing password: ${e.localizedMessage}")
            }
        }
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
                // Ensure field names match backend expectations (image/avatar)
                val finalUpdates = updates.toMutableMap()
                if (finalUpdates.containsKey("avatar")) {
                    val avatarUrl = finalUpdates["avatar"]
                    if (avatarUrl != null) {
                        finalUpdates["image"] = avatarUrl
                    }
                }

                val response = authApi.updateMe(finalUpdates)
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
                                statusText = body.statusText ?: currentUser.statusText,
                                statusEmoji = body.statusEmoji ?: currentUser.statusEmoji,
                                bio = body.bio ?: currentUser.bio
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

    fun setPendingAvatar(uri: android.net.Uri?) {
        _uiState.update { it.copy(pendingAvatarUri = uri) }
    }

    fun setPendingBanner(uri: android.net.Uri?) {
        _uiState.update { it.copy(pendingBannerUri = uri) }
    }

    fun saveProfile(updates: Map<String, Any>, context: android.content.Context) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUploading = true) }
            try {
                val finalUpdates = updates.toMutableMap()

                // Upload avatar if pending
                _uiState.value.pendingAvatarUri?.let { uri ->
                    val file = uriToFile(uri, context)
                    val result = storageRepository.uploadFile(file)
                    result.onSuccess { response ->
                        finalUpdates["avatar"] = response.url
                    }.onFailure { e ->
                        _errorEvents.tryEmit("Avatar upload failed: ${e.localizedMessage}")
                        _uiState.update { it.copy(isUploading = false) }
                        return@launch
                    }
                }

                // Upload banner if pending
                _uiState.value.pendingBannerUri?.let { uri ->
                    val file = uriToFile(uri, context)
                    val result = storageRepository.uploadFile(file)
                    result.onSuccess { response ->
                        finalUpdates["banner"] = response.url
                    }.onFailure { e ->
                        _errorEvents.tryEmit("Banner upload failed: ${e.localizedMessage}")
                        _uiState.update { it.copy(isUploading = false) }
                        return@launch
                    }
                }

                updateProfile(finalUpdates)
                _uiState.update { it.copy(pendingAvatarUri = null, pendingBannerUri = null) }
            } catch (e: Exception) {
                _errorEvents.tryEmit("Error saving profile: ${e.localizedMessage}")
            } finally {
                _uiState.update { it.copy(isUploading = false) }
            }
        }
    }

    private fun uriToFile(uri: android.net.Uri, context: android.content.Context): File {
        val inputStream = context.contentResolver.openInputStream(uri)
        val file = File(context.cacheDir, "upload_${java.util.UUID.randomUUID()}.jpg")
        val outputStream = java.io.FileOutputStream(file)
        inputStream?.use { input ->
            outputStream.use { output ->
                input.copyTo(output)
            }
        }
        return file
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

    fun sendFriendRequest(userId: String) {
        viewModelScope.launch {
            val result = friendsRepository.sendFriendRequest(userId)
            if (result is com.scrymechat.android.common.Resource.Success) {
                fetchUser(userId)
            } else {
                _errorEvents.tryEmit(result.message ?: "Failed to send friend request")
            }
        }
    }

    fun acceptFriendRequest(requestId: String, userId: String) {
        viewModelScope.launch {
            val result = friendsRepository.updateFriendRequest(requestId, "accept")
            if (result is com.scrymechat.android.common.Resource.Success) {
                fetchUser(userId)
            } else {
                _errorEvents.tryEmit(result.message ?: "Failed to accept friend request")
            }
        }
    }

    fun cancelFriendRequest(requestId: String, userId: String) {
        viewModelScope.launch {
            val result = friendsRepository.updateFriendRequest(requestId, "cancel")
            if (result is com.scrymechat.android.common.Resource.Success) {
                fetchUser(userId)
            } else {
                _errorEvents.tryEmit(result.message ?: "Failed to cancel friend request")
            }
        }
    }

    private val _targetUser = MutableStateFlow<UserEntity?>(null)
    val targetUser: StateFlow<UserEntity?> = _targetUser.asStateFlow()

    private val _isLoadingTarget = MutableStateFlow(false)
    val isLoadingTarget: StateFlow<Boolean> = _isLoadingTarget.asStateFlow()

    private val _socialProfile = MutableStateFlow<SocialProfileDto?>(null)
    val socialProfile: StateFlow<SocialProfileDto?> = _socialProfile.asStateFlow()

    fun fetchUser(userId: String) {
        viewModelScope.launch {
            _isLoadingTarget.value = true
            try {
                launch {
                    val socialResult = authRepository.getSocialProfile(userId)
                    socialResult.onSuccess { profile ->
                        _socialProfile.value = profile
                    }
                }

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
    val isUploading: Boolean = false,
    val pendingAvatarUri: android.net.Uri? = null,
    val pendingBannerUri: android.net.Uri? = null
)
