package com.scrymechat.android.ui.discovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.remote.UserDto
import com.scrymechat.android.data.remote.WorkspaceDto
import com.scrymechat.android.data.repository.AuthRepository
import com.scrymechat.android.data.repository.FriendsRepository
import com.scrymechat.android.data.repository.WorkspaceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DiscoveryViewModel @Inject constructor(
    private val workspaceRepository: WorkspaceRepository,
    private val authRepository: AuthRepository,
    private val friendsRepository: FriendsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DiscoveryUiState())
    val uiState: StateFlow<DiscoveryUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadDiscoverableWorkspaces()
    }

    fun setTab(index: Int) {
        _uiState.update { it.copy(selectedTab = index) }
        // If query is empty and switching to workspaces, reload
        if (_uiState.value.searchQuery.isEmpty() && index == 0) {
            loadDiscoverableWorkspaces()
        } else if (_uiState.value.searchQuery.length >= 2) {
            performSearch(_uiState.value.searchQuery)
        }
    }

    fun loadDiscoverableWorkspaces(query: String? = null) {
        viewModelScope.launch {
            workspaceRepository.discoverWorkspaces(query).collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        _uiState.update { it.copy(workspaces = resource.data ?: emptyList(), isLoading = false) }
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

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        if (query.length >= 2) {
            searchJob = viewModelScope.launch {
                delay(300) // Debounce
                performSearch(query)
            }
        } else {
            _uiState.update { it.copy(users = emptyList()) }
            if (_uiState.value.selectedTab == 0) {
                loadDiscoverableWorkspaces()
            }
        }
    }

    private fun performSearch(query: String) {
        if (_uiState.value.selectedTab == 0) {
            loadDiscoverableWorkspaces(query)
        } else {
            viewModelScope.launch {
                searchUsers(query)
            }
        }
    }

    private suspend fun searchUsers(query: String) {
        _uiState.update { it.copy(isSearching = true) }
        val result = authRepository.searchUsers(query)
        result.onSuccess { users ->
            _uiState.update { it.copy(users = users, isSearching = false) }
        }.onFailure { error ->
            _uiState.update { it.copy(error = error.message, isSearching = false) }
        }
    }

    fun joinWorkspace(slug: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isJoining = true) }
            val result = workspaceRepository.joinWorkspace(slug)
            if (result is Resource.Success) {
                _uiState.update { it.copy(isJoining = false, joinedWorkspaceSlug = slug) }
                loadDiscoverableWorkspaces()
            } else {
                _uiState.update { it.copy(isJoining = false, error = result.message) }
            }
        }
    }

    fun sendFriendRequest(userId: String) {
        viewModelScope.launch {
            friendsRepository.sendFriendRequest(userId)
            // Optionally update UI to show request sent
        }
    }

    fun clearJoinedStatus() {
        _uiState.update { it.copy(joinedWorkspaceSlug = null) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}

data class DiscoveryUiState(
    val workspaces: List<WorkspaceDto> = emptyList(),
    val users: List<UserDto> = emptyList(),
    val searchQuery: String = "",
    val selectedTab: Int = 0,
    val isLoading: Boolean = false,
    val isSearching: Boolean = false,
    val isJoining: Boolean = false,
    val joinedWorkspaceSlug: String? = null,
    val error: String? = null
)
