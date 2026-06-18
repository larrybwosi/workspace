package com.scrymechat.android.ui.friends

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.dao.FriendsDao
import com.scrymechat.android.data.local.entities.FriendEntity
import com.scrymechat.android.data.local.entities.FriendRequestEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.remote.AuthApi
import com.scrymechat.android.data.repository.FriendsRepository
import com.scrymechat.android.data.repository.InvitationsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FriendsViewModel @Inject constructor(
    private val friendsRepository: FriendsRepository,
    private val invitationsRepository: InvitationsRepository,
    private val sessionManager: SessionManager,
    private val friendsDao: FriendsDao,
    private val authApi: AuthApi
) : ViewModel() {

    private val _uiState = MutableStateFlow(FriendsUiState())
    val uiState: StateFlow<FriendsUiState> = _uiState.asStateFlow()

    init {
        loadData()
        observeData()
    }

    fun loadData() {
        viewModelScope.launch {
            friendsRepository.getFriends().collect { resource ->
                if (resource is Resource.Loading) _uiState.update { it.copy(isLoading = true) }
                else _uiState.update { it.copy(isLoading = false) }
            }
        }
        viewModelScope.launch {
            friendsRepository.getFriendRequests().collect { }
        }
    }

    private fun observeData() {
        viewModelScope.launch {
            sessionManager.getActiveSessionFlow().collect { session ->
                session?.userId?.let { userId ->
                    friendsDao.getFriendsWithUserDetails(userId).collect { friends ->
                        _uiState.update { it.copy(friends = friends) }
                    }
                }
            }
        }
        viewModelScope.launch {
            friendsDao.getAllFriendRequestsFlow().collect { requests ->
                _uiState.update { it.copy(requests = requests) }
            }
        }
    }

    fun sendFriendRequest(username: String) {
        viewModelScope.launch {
            try {
                val searchResponse = authApi.searchUser(username)
                if (searchResponse.isSuccessful && searchResponse.body() != null) {
                    val userId = searchResponse.body()!!.id
                    friendsRepository.sendFriendRequest(userId)
                    loadData()
                } else {
                    _uiState.update { it.copy(error = "User not found") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "Failed to find user") }
            }
        }
    }

    fun acceptRequest(requestId: String) {
        viewModelScope.launch {
            friendsRepository.updateFriendRequest(requestId, "accept")
            loadData()
        }
    }

    fun declineRequest(requestId: String) {
        viewModelScope.launch {
            friendsRepository.updateFriendRequest(requestId, "decline")
            loadData()
        }
    }

    fun inviteUser(email: String) {
        viewModelScope.launch {
            invitationsRepository.createInvitation(email)
            // Show success message or handle error
        }
    }
}

data class FriendsUiState(
    val friends: List<UserEntity> = emptyList(),
    val requests: List<FriendRequestEntity> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
