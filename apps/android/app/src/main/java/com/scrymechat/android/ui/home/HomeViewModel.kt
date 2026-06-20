package com.scrymechat.android.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.dao.DmDao
import com.scrymechat.android.data.local.dao.DmWithUser
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.local.entities.DmConversationEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceEntity
import com.scrymechat.android.data.repository.ChannelRepository
import com.scrymechat.android.data.repository.DmRepository
import com.scrymechat.android.data.repository.RealtimeRepository
import com.scrymechat.android.data.repository.WorkspaceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val workspaceRepository: WorkspaceRepository,
    private val channelRepository: ChannelRepository,
    private val dmRepository: DmRepository,
    private val realtimeRepository: RealtimeRepository,
    private val sessionManager: SessionManager,
    private val dmDao: DmDao
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadWorkspaces()
        loadDms()
        observeCurrentUser()
        observeRealtimeMessages()
    }

    private fun observeCurrentUser() {
        viewModelScope.launch {
            sessionManager.getActiveSessionFlow().collect { session ->
                session?.userId?.let { userId ->
                    sessionManager.getUserFlow(userId).collect { user ->
                        _uiState.update { it.copy(currentUser = user) }
                    }
                }
            }
        }
    }

    fun loadWorkspaces() {
        viewModelScope.launch {
            workspaceRepository.getWorkspaces().collect { resource ->
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

    fun selectWorkspace(workspace: WorkspaceEntity?) {
        _uiState.update { it.copy(selectedWorkspace = workspace, selectedChannel = null, isHomeSelected = workspace == null) }
        if (workspace != null) {
            loadChannels(workspace.slug)
        }
    }

    private fun loadChannels(workspaceSlug: String) {
        viewModelScope.launch {
            channelRepository.getWorkspaceChannels(workspaceSlug).collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        _uiState.update { it.copy(channels = resource.data ?: emptyList()) }
                    }
                    is Resource.Error -> {
                        // Handle error
                    }
                    is Resource.Loading -> {
                        // Handle loading
                    }
                }
            }
        }
    }

    fun selectChannel(channel: ChannelEntity) {
        _uiState.update { it.copy(selectedChannel = channel) }
    }

    fun selectHome() {
        selectWorkspace(null)
        loadDms()
    }

    private fun loadDms() {
        viewModelScope.launch {
            dmRepository.getDms().collect { /* Just trigger sync */ }
        }
        viewModelScope.launch {
            dmDao.getDmsWithUserInfoFlow().collect { dms ->
                _uiState.update { it.copy(dms = dms) }
            }
        }
    }

    private fun observeRealtimeMessages() {
        viewModelScope.launch {
            realtimeRepository.observeMessages().collect { messageDto ->
                if (messageDto.dmId != null) {
                    loadDms() // Refresh DM list to update last message and sorting
                }
            }
        }
    }

    fun toggleCategory(categoryId: String) {
        _uiState.update { state ->
            val newExpanded = if (state.expandedCategories.contains(categoryId)) {
                state.expandedCategories - categoryId
            } else {
                state.expandedCategories + categoryId
            }
            state.copy(expandedCategories = newExpanded)
        }
    }
}

data class HomeUiState(
    val workspaces: List<WorkspaceEntity> = emptyList(),
    val channels: List<ChannelEntity> = emptyList(),
    val dms: List<DmWithUser> = emptyList(),
    val selectedWorkspace: WorkspaceEntity? = null,
    val selectedChannel: ChannelEntity? = null,
    val isHomeSelected: Boolean = true,
    val currentUser: UserEntity? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val expandedCategories: Set<String> = emptySet()
)
