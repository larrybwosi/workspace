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

    /**
     * Atomically and sequentially selects a workspace and a channel within it.
     * This avoids race conditions between parallel async operations that can result
     * in the selected channel being wiped out, which would cause the workspace
     * welcome screen to be shown instead of the chat view.
     */
    fun selectWorkspaceAndChannel(workspaceSlug: String, channelId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isChannelLoading = true) }

            // 1. Try to fetch/render from local cache/database first to avoid any layout flash
            val localWorkspaces = _uiState.value.workspaces
            val workspace = localWorkspaces.find { it.slug == workspaceSlug }
                ?: workspaceRepository.getWorkspaceBySlug(workspaceSlug)
            val channel = channelRepository.getChannel(channelId)

            if (workspace != null && channel != null) {
                _uiState.update { state ->
                    state.copy(
                        selectedWorkspace = workspace,
                        selectedChannel = channel,
                        selectedDm = null,
                        isHomeSelected = false
                    )
                }
            }

            // 2. Fetch/refresh workspaces from server
            try {
                val workspaceResource = workspaceRepository.getWorkspaces()
                    .first { it !is Resource.Loading }

                if (workspaceResource is Resource.Success) {
                    val workspaces = workspaceResource.data ?: emptyList()
                    _uiState.update { it.copy(workspaces = workspaces) }

                    val updatedWorkspace = workspaces.find { it.slug == workspaceSlug }
                        ?: workspaceRepository.getWorkspaceBySlug(workspaceSlug)

                    if (updatedWorkspace != null) {
                        // 3. Fetch channels of the selected workspace
                        val channelsResource = channelRepository.getWorkspaceChannels(workspaceSlug)
                            .first { it !is Resource.Loading }

                        if (channelsResource is Resource.Success) {
                            val channels = channelsResource.data ?: emptyList()

                            // Find the target channel from the list, database, or server
                            val updatedChannel = channels.find { it.id == channelId }
                                ?: channelRepository.getChannel(channelId)
                                ?: channelRepository.fetchChannelFromServer(workspaceSlug, channelId).let {
                                    if (it is Resource.Success) it.data else null
                                }

                            _uiState.update { state ->
                                state.copy(
                                    selectedWorkspace = updatedWorkspace,
                                    channels = channels,
                                    selectedChannel = updatedChannel,
                                    selectedDm = null,
                                    isHomeSelected = false,
                                    isChannelLoading = false
                                )
                            }
                        } else {
                            _uiState.update { it.copy(isChannelLoading = false, error = channelsResource.message) }
                        }
                    } else {
                        _uiState.update { it.copy(isChannelLoading = false, error = "Workspace not found") }
                    }
                } else {
                    _uiState.update { it.copy(isChannelLoading = false, error = workspaceResource.message) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isChannelLoading = false, error = e.localizedMessage ?: "Failed to load channel") }
            }
        }
    }

    private var selectDmJob: kotlinx.coroutines.Job? = null

    fun selectDmByUserId(userId: String) {
        _uiState.update { it.copy(isHomeSelected = false, selectedChannel = null) }
        selectDmJob?.cancel()
        selectDmJob = viewModelScope.launch {
            dmDao.getDmsWithUserInfoFlow().collect { dms ->
                val dm = dms.find { it.dm.otherUserId == userId }
                if (dm != null) {
                    selectDm(dm)
                } else {
                    val fallbackDm = DmWithUser(
                        dm = DmConversationEntity(
                            id = "",
                            creatorId = "",
                            otherUserId = userId,
                            lastMessageAt = ""
                        ),
                        otherUserName = "User",
                        otherUserAvatar = null
                    )
                    _uiState.update { state ->
                        if (state.selectedDm == null || state.selectedDm.dm.otherUserId != userId) {
                            state.copy(selectedDm = fallbackDm, selectedChannel = null, isHomeSelected = false)
                        } else {
                            state
                        }
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

    fun selectWorkspace(workspace: WorkspaceEntity?, keepChannelId: String? = null) {
        _uiState.update { state ->
            val channel = if (state.selectedChannel?.id == keepChannelId && keepChannelId != null) {
                state.selectedChannel
            } else if (state.selectedWorkspace?.id == workspace?.id) {
                state.selectedChannel
            } else {
                null
            }
            state.copy(selectedWorkspace = workspace, selectedChannel = channel, isHomeSelected = workspace == null)
        }
        if (workspace != null) {
            loadChannels(workspace.slug)
        }
    }

    fun selectWorkspaceBySlug(slug: String, keepChannelId: String? = null) {
        if (_uiState.value.selectedWorkspace?.slug == slug) return
        viewModelScope.launch {
            // First refresh workspaces to ensure we have the new one
            workspaceRepository.getWorkspaces().collect { resource ->
                if (resource is Resource.Success) {
                    val workspaces = resource.data ?: emptyList()
                    _uiState.update { it.copy(workspaces = workspaces) }

                    val workspace = workspaces.find { it.slug == slug }
                    if (workspace != null) {
                        selectWorkspace(workspace, keepChannelId)
                    }
                }
            }
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
        _uiState.update { it.copy(selectedChannel = channel, selectedDm = null, isHomeSelected = false, isChannelLoading = false) }
    }

    fun selectChannelById(channelId: String, slug: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isChannelLoading = true) }
            val channel = channelRepository.getChannel(channelId)
            if (channel != null) {
                selectChannel(channel)
            } else if (slug != null) {
                val result = channelRepository.fetchChannelFromServer(slug, channelId)
                if (result is Resource.Success && result.data != null) {
                    selectChannel(result.data)
                } else {
                    _uiState.update { it.copy(isChannelLoading = false) }
                }
            } else {
                _uiState.update { it.copy(isChannelLoading = false) }
            }
        }
    }

    fun selectDm(dm: DmWithUser) {
        _uiState.update { it.copy(selectedDm = dm, selectedChannel = null, isHomeSelected = false) }
    }

    fun selectDmById(dmId: String) {
        _uiState.update { it.copy(isHomeSelected = false, selectedChannel = null) }
        selectDmJob?.cancel()
        selectDmJob = viewModelScope.launch {
            dmDao.getDmsWithUserInfoFlow().collect { dms ->
                val dm = dms.find { it.dm.id == dmId }
                if (dm != null) {
                    selectDm(dm)
                } else {
                    val dmEntity = dmDao.getDmById(dmId)
                    val fallbackDm = DmWithUser(
                        dm = dmEntity ?: DmConversationEntity(
                            id = dmId,
                            creatorId = "",
                            otherUserId = "",
                            lastMessageAt = ""
                        ),
                        otherUserName = "User",
                        otherUserAvatar = null
                    )
                    _uiState.update { state ->
                        if (state.selectedDm == null || state.selectedDm.dm.id != dmId) {
                            state.copy(selectedDm = fallbackDm, selectedChannel = null, isHomeSelected = false)
                        } else {
                            state
                        }
                    }
                }
            }
        }
    }

    fun selectHome() {
        _uiState.update { it.copy(isHomeSelected = true, selectedChannel = null, selectedDm = null, selectedWorkspace = null) }
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

    fun setCreateWorkspaceDialogOpen(isOpen: Boolean) {
        _uiState.update { it.copy(isCreateWorkspaceDialogOpen = isOpen) }
    }

    fun createWorkspace(request: com.scrymechat.android.data.remote.CreateWorkspaceRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(isCreatingWorkspace = true, error = null) }
            val result = workspaceRepository.createWorkspace(request)
            if (result is Resource.Success) {
                _uiState.update { it.copy(isCreatingWorkspace = false, isCreateWorkspaceDialogOpen = false) }
                loadWorkspaces()
            } else {
                _uiState.update { it.copy(isCreatingWorkspace = false, error = result.message) }
            }
        }
    }

    fun setCreateChannelDialogOpen(isOpen: Boolean) {
        _uiState.update { it.copy(isCreateChannelDialogOpen = isOpen) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun createChannel(request: com.scrymechat.android.data.remote.CreateChannelRequest, categoryId: String?) {
        viewModelScope.launch {
            val workspaceSlug = _uiState.value.selectedWorkspace?.slug ?: return@launch
            _uiState.update { it.copy(isCreatingChannel = true, error = null) }
            val finalRequest = if (categoryId != null) {
                request.copy(departmentId = categoryId) // Using departmentId as parentId based on CreateChannelRequest
            } else {
                request
            }
            val result = channelRepository.createChannel(workspaceSlug, finalRequest)
            if (result is Resource.Success) {
                _uiState.update { it.copy(isCreatingChannel = false, isCreateChannelDialogOpen = false) }
                loadChannels(workspaceSlug)
            } else {
                _uiState.update { it.copy(isCreatingChannel = false, error = result.message) }
            }
        }
    }
}

data class HomeUiState(
    val workspaces: List<WorkspaceEntity> = emptyList(),
    val channels: List<ChannelEntity> = emptyList(),
    val dms: List<DmWithUser> = emptyList(),
    val selectedWorkspace: WorkspaceEntity? = null,
    val selectedChannel: ChannelEntity? = null,
    val selectedDm: DmWithUser? = null,
    val isHomeSelected: Boolean = true,
    val currentUser: UserEntity? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val expandedCategories: Set<String> = emptySet(),
    val isCreateWorkspaceDialogOpen: Boolean = false,
    val isCreateChannelDialogOpen: Boolean = false,
    val isCreatingWorkspace: Boolean = false,
    val isCreatingChannel: Boolean = false,
    val isChannelLoading: Boolean = false
)
