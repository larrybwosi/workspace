package com.scrymechat.android.ui.share

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.ShareManager
import com.scrymechat.android.data.local.SharedContent
import com.scrymechat.android.data.local.dao.ChannelDao
import com.scrymechat.android.data.local.dao.DmDao
import com.scrymechat.android.data.local.dao.WorkspaceDao
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.local.dao.DmWithUser
import com.scrymechat.android.data.remote.CreateAttachmentRequest
import com.scrymechat.android.data.repository.ChatRepository
import com.scrymechat.android.data.repository.ChannelRepository
import com.scrymechat.android.data.repository.DmRepository
import com.scrymechat.android.data.repository.StorageRepository
import com.scrymechat.android.data.repository.WorkspaceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

data class ShareUiState(
    val sharedContent: SharedContent? = null,
    val workspaces: List<com.scrymechat.android.data.local.entities.WorkspaceEntity> = emptyList(),
    val channels: List<ChannelEntity> = emptyList(),
    val dms: List<DmWithUser> = emptyList(),
    val isLoading: Boolean = false,
    val isShareSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ShareViewModel @Inject constructor(
    private val workspaceRepository: WorkspaceRepository,
    private val channelRepository: ChannelRepository,
    private val dmRepository: DmRepository,
    private val storageRepository: StorageRepository,
    private val chatRepository: ChatRepository,
    private val shareManager: ShareManager,
    private val dmDao: DmDao,
    private val channelDao: ChannelDao,
    private val workspaceDao: WorkspaceDao
) : ViewModel() {

    private val _uiState = MutableStateFlow(ShareUiState())
    val uiState: StateFlow<ShareUiState> = _uiState.asStateFlow()

    init {
        // Observe shared content
        viewModelScope.launch {
            shareManager.sharedContent.collect { content ->
                _uiState.update { it.copy(sharedContent = content) }
            }
        }

        // Load workspaces from DB and server
        viewModelScope.launch {
            workspaceDao.getAllWorkspacesFlow().collect { localWorkspaces ->
                _uiState.update { it.copy(workspaces = localWorkspaces) }
            }
        }
        viewModelScope.launch {
            workspaceRepository.getWorkspaces().collect { /* Sync server workspaces to local DB */ }
        }

        // Load DMs
        viewModelScope.launch {
            dmDao.getDmsWithUserInfoFlow().collect { localDms ->
                _uiState.update { it.copy(dms = localDms) }
            }
        }
        viewModelScope.launch {
            dmRepository.getDms().collect { /* Sync server DMs to local DB */ }
        }

        // Sync and query channels for all workspaces
        viewModelScope.launch {
            workspaceDao.getAllWorkspacesFlow().collect { workspaces ->
                workspaces.forEach { workspace ->
                    launch {
                        channelRepository.getWorkspaceChannels(workspace.slug).collect { resource ->
                            if (resource is Resource.Success && resource.data != null) {
                                val allChannels = (_uiState.value.channels + resource.data).distinctBy { it.id }
                                _uiState.update { it.copy(channels = allChannels) }
                            }
                        }
                    }
                }
            }
        }
    }

    fun shareToTargets(
        selectedChannelIds: List<String>,
        selectedDmIds: List<String>,
        commentText: String,
        context: Context
    ) {
        val sharedContent = _uiState.value.sharedContent ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                // 1. Upload files if any
                val uploadedAttachments = mutableListOf<CreateAttachmentRequest>()
                for (uri in sharedContent.uris) {
                    val inputStream = context.contentResolver.openInputStream(uri) ?: continue
                    val tempFile = File.createTempFile("share_upload", null, context.cacheDir)
                    tempFile.outputStream().use { outputStream ->
                        inputStream.copyTo(outputStream)
                    }

                    val result = storageRepository.uploadFile(tempFile)
                    if (result.isSuccess) {
                        val uploadResponse = result.getOrThrow()
                        uploadedAttachments.add(
                            CreateAttachmentRequest(
                                name = uploadResponse.name,
                                type = uploadResponse.type,
                                url = uploadResponse.url,
                                size = uploadResponse.size.toInt()
                            )
                        )
                    } else {
                        val errorMsg = result.exceptionOrNull()?.message ?: "Upload failed"
                        _uiState.update { it.copy(isLoading = false, error = "Failed to upload file: $errorMsg") }
                        tempFile.delete()
                        return@launch
                    }
                    tempFile.delete()
                }

                // Prepare final content
                // If there's shared text, we append it or use the custom text comment entered by the user
                val messageContent = if (sharedContent.text != null && commentText.isBlank()) {
                    sharedContent.text
                } else if (sharedContent.text != null) {
                    "${sharedContent.text}\n\n$commentText"
                } else {
                    commentText
                }

                // 2. Send messages to DMs
                for (dmId in selectedDmIds) {
                    chatRepository.sendDmMessage(
                        conversationId = dmId,
                        content = messageContent,
                        replyToId = null,
                        attachments = uploadedAttachments
                    )
                }

                // 3. Send messages to Channels
                for (channelId in selectedChannelIds) {
                    val channelEntity = channelDao.getChannelById(channelId)
                    if (channelEntity != null) {
                        val workspace = workspaceDao.getWorkspaceById(channelEntity.workspaceId)
                        val slug = workspace?.slug
                        if (slug != null) {
                            chatRepository.sendChannelMessage(
                                workspaceSlug = slug,
                                channelId = channelId,
                                content = messageContent,
                                replyToId = null,
                                attachments = uploadedAttachments
                            )
                        }
                    }
                }

                // Clear shared content
                shareManager.clear()
                _uiState.update { it.copy(isLoading = false, isShareSuccess = true) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.localizedMessage ?: "Failed to share content") }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
