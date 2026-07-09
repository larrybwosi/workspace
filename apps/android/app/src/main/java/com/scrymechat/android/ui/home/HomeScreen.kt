package com.scrymechat.android.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Tag
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.scrymechat.android.ui.chat.ChatView
import com.scrymechat.android.ui.chat.ChatViewModel
import com.scrymechat.android.ui.chat.ForwardMessageDialog
import com.scrymechat.android.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    chatViewModel: ChatViewModel = hiltViewModel(),
    workspaceSlug: String? = null,
    channelId: String? = null,
    dmId: String? = null,
    dmUserId: String? = null,
    onSettingsClick: () -> Unit,
    onFriendsClick: () -> Unit = {},
    onDiscoveryClick: () -> Unit = {},
    onUserProfileClick: (String) -> Unit = {},
    onWorkspaceClick: (String?) -> Unit = {},
    onChannelClick: (String, String?) -> Unit = { _, _ -> },
    onDmClick: (String) -> Unit = {},
    onNotificationsClick: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val chatUiState by chatViewModel.uiState.collectAsState()
    val formStates by chatViewModel.formStates.collectAsState()
    val loadingActions by chatViewModel.loadingActions.collectAsState()
    var forwardingMessage by remember { mutableStateOf<com.scrymechat.android.data.local.entities.MessageEntity?>(null) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(workspaceSlug, channelId, dmId, dmUserId) {
    when {
        dmId != null -> {
            viewModel.selectDmById(dmId)
            chatViewModel.setDm(dmId)
        }
        dmUserId != null -> {
            viewModel.selectDmByUserId(dmUserId)
            chatViewModel.setDmByUser(dmUserId)
        } else if (channelId != null) {
            workspaceSlug?.let { viewModel.selectWorkspaceBySlug(it, channelId) }
            viewModel.selectChannelById(channelId, workspaceSlug)
            chatViewModel.setChannel(channelId)
        }
        workspaceSlug != null -> {
            viewModel.selectWorkspaceBySlug(workspaceSlug)
            chatViewModel.setWorkspaceSlug(workspaceSlug)
        }
        else -> viewModel.selectHome()
    }
}

    if (channelId != null) {
        androidx.activity.compose.BackHandler {
            onWorkspaceClick(workspaceSlug)
        }
    }

    if (forwardingMessage != null) {
        ForwardMessageDialog(
            message = forwardingMessage!!,
            channels = uiState.channels,
            onForward = { channelId ->
                chatViewModel.sendMessage(
                    content = "Forwarded message from ${forwardingMessage!!.senderName ?: "User"}:\n\n${forwardingMessage!!.content}",
                    targetChannelId = channelId,
                    context = context
                )
                forwardingMessage = null
            },
            onDismiss = { forwardingMessage = null }
        )
    }

    if (uiState.isCreateWorkspaceDialogOpen) {
        CreateWorkspaceDialog(
            isLoading = uiState.isCreatingWorkspace,
            onDismiss = { viewModel.setCreateWorkspaceDialogOpen(false) },
            onCreate = { viewModel.createWorkspace(it) }
        )
    }

    if (uiState.isCreateChannelDialogOpen) {
        CreateChannelDialog(
            categories = uiState.channels.filter { it.type == "category" },
            isLoading = uiState.isCreatingChannel,
            onDismiss = { viewModel.setCreateChannelDialogOpen(false) },
            onCreate = { request, categoryId -> viewModel.createChannel(request, categoryId) }
        )
    }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            snackbarHostState.showSnackbar(
                message = it,
                duration = SnackbarDuration.Short
            )
            viewModel.clearError()
        }
    }

    chatUiState.activeModal?.let { modal ->
        com.scrymechat.android.ui.components.CustomMessageModal(
            customMessage = modal.customMessage,
            formState = formStates[modal.messageId] ?: emptyMap(),
            onUpdateForm = { fieldId, value -> chatViewModel.updateFormState(modal.messageId, fieldId, value) },
            onActionTriggered = { action ->
                chatViewModel.handleMessageAction(context, chatUiState.messages.find { it.id == modal.messageId }!!, action, formStates[modal.messageId] ?: emptyMap())
            },
            onDismiss = { chatViewModel.dismissModal() }
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Color.Transparent
    ) { padding ->
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet(
                    drawerContainerColor = Color.Transparent,
                    drawerTonalElevation = 0.dp,
                    modifier = Modifier.width(312.dp) // 72 + 240
                ) {
                    Row(modifier = Modifier.fillMaxSize()) {
                        WorkspaceRail(
                            workspaces = uiState.workspaces,
                            selectedWorkspace = uiState.selectedWorkspace,
                            isHomeSelected = uiState.isHomeSelected,
                            onWorkspaceClick = { onWorkspaceClick(it.slug) },
                            onHomeClick = { onWorkspaceClick(null) },
                            onCreateWorkspaceClick = { onDiscoveryClick() },
                            onNotificationsClick = onNotificationsClick
                        )

                        ChannelSidebar(
                            workspace = uiState.selectedWorkspace,
                            channels = uiState.channels,
                            selectedChannel = uiState.selectedChannel,
                            isHomeSelected = uiState.isHomeSelected,
                            currentUser = uiState.currentUser,
                            expandedCategories = uiState.expandedCategories,
                            dms = uiState.dms,
                            selectedDm = uiState.selectedDm,
                            onChannelClick = {
                                onChannelClick(it.id, uiState.selectedWorkspace?.slug)
                                scope.launch { drawerState.close() }
                            },
                            onDmClick = {
                                onDmClick(it.dm.id)
                                scope.launch { drawerState.close() }
                            },
                            onCategoryToggle = { viewModel.toggleCategory(it) },
                            onSettingsClick = onSettingsClick,
                            onFriendsClick = {
                                onFriendsClick()
                                scope.launch { drawerState.close() }
                            },
                            onCreateChannelClick = { viewModel.setCreateChannelDialogOpen(true) }
                        )
                    }
                }
            }
        ) {
            MainContent(
                uiState = uiState,
                selectedWorkspace = uiState.selectedWorkspace,
                selectedChannel = uiState.selectedChannel,
                isHomeSelected = uiState.isHomeSelected,
                chatUiState = chatUiState,
                currentUser = uiState.currentUser,
                onSendMessage = { content, replyToId, _ -> chatViewModel.sendMessage(content, replyToId, null, context) },
                onReply = { /* Handled in ChatView */ },
                onOpenThread = { message ->
                    uiState.selectedChannel?.let { channel ->
                        chatViewModel.setThread(channel.id, message)
                    }
                },
                onForward = { forwardingMessage = it },
                onBack = {
                    uiState.selectedChannel?.let { channel ->
                        chatViewModel.setChannel(channel.id)
                    }
                },
                isDm = uiState.selectedDm != null,
                onDownload = { attachment -> chatViewModel.downloadAttachment(attachment.url, attachment.name, attachment.type) },
                onAction = { message, action, formState -> chatViewModel.handleMessageAction(context, message, action, formState) },
                onUpdateForm = { messageId, fieldId, value -> chatViewModel.updateFormState(messageId, fieldId, value) },
                onAttach = { uri -> chatViewModel.addPendingFile(uri, context) },
                onRemoveFile = { chatViewModel.removePendingFile(it) },
                isSending = chatUiState.isSending,
                pendingFiles = chatUiState.pendingFiles,
                formStates = formStates,
                loadingActions = loadingActions,
                onTyping = {
                    uiState.currentUser?.let { user ->
                        chatViewModel.sendTyping(user.id, user.name)
                    }
                },
                onMenuClick = { scope.launch { drawerState.open() } },
                onAvatarClick = onUserProfileClick,
                channels = uiState.channels,
                suggestedUsers = chatUiState.suggestedUsers,
                onSearchUsers = { query -> chatViewModel.searchUsersForMention(query) },
                onClearSuggestedUsers = { chatViewModel.clearSuggestedUsers() },
                onMentionClick = { username ->
                    chatViewModel.navigateToUserProfile(username) { userId ->
                        onUserProfileClick(userId)
                    }
                },
                onChannelTagClick = { channelName ->
                    uiState.channels.find { it.name.equals(channelName, ignoreCase = true) }?.let { channel ->
                        onChannelClick(channel.id, uiState.selectedWorkspace?.slug)
                    }
                },
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            )
        }
    }
}

@Composable
fun MainContent(
    uiState: HomeUiState,
    selectedWorkspace: com.scrymechat.android.data.local.entities.WorkspaceEntity?,
    selectedChannel: com.scrymechat.android.data.local.entities.ChannelEntity?,
    isHomeSelected: Boolean,
    chatUiState: com.scrymechat.android.ui.chat.ChatUiState,
    currentUser: com.scrymechat.android.data.local.entities.UserEntity?,
    onSendMessage: (String, String?, List<com.scrymechat.android.data.remote.CreateAttachmentRequest>?) -> Unit,
    onReply: (com.scrymechat.android.data.local.entities.MessageEntity) -> Unit,
    onOpenThread: (com.scrymechat.android.data.local.entities.MessageEntity) -> Unit = {},
    onForward: (com.scrymechat.android.data.local.entities.MessageEntity) -> Unit,
    onBack: () -> Unit = {},
    isDm: Boolean = false,
    onDownload: (com.scrymechat.android.data.remote.AttachmentDto) -> Unit = {},
    onAction: (com.scrymechat.android.data.local.entities.MessageEntity, com.scrymechat.android.data.remote.MessageActionDto, Map<String, Any>) -> Unit = { _, _, _ -> },
    onUpdateForm: (String, String, Any) -> Unit = { _, _, _ -> },
    onAttach: (android.net.Uri) -> Unit = {},
    onRemoveFile: (com.scrymechat.android.ui.chat.PendingFile) -> Unit = {},
    isSending: Boolean = false,
    pendingFiles: List<com.scrymechat.android.ui.chat.PendingFile> = emptyList(),
    formStates: Map<String, Map<String, Any>> = emptyMap(),
    loadingActions: Set<String> = emptySet(),
    onTyping: () -> Unit,
    onMenuClick: () -> Unit,
    onAvatarClick: (String) -> Unit = {},
    channels: List<com.scrymechat.android.data.local.entities.ChannelEntity> = emptyList(),
    suggestedUsers: List<com.scrymechat.android.data.remote.UserDto> = emptyList(),
    onSearchUsers: (String) -> Unit = {},
    onClearSuggestedUsers: () -> Unit = {},
    onMentionClick: (String) -> Unit = {},
    onChannelTagClick: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(ScrymeDarkSurfaceVariant)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            val title = when {
                isHomeSelected -> "Home"
                selectedChannel != null -> selectedChannel.name
                uiState.selectedDm != null -> uiState.selectedDm.otherUserName ?: "Unknown User"
                else -> selectedWorkspace?.name ?: "Scrymechat"
            }

            // Top Bar — slightly taller, with a subtle elevation line instead of a flat divider
            Surface(
                color = ScrymeDarkSurfaceVariant,
                shadowElevation = 2.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onMenuClick) {
                        Icon(
                            Icons.Default.Menu,
                            contentDescription = "Menu",
                            tint = ScrymeDarkTextPrimary,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(4.dp))

                    val titleIcon = when {
                        isHomeSelected -> null
                        selectedChannel != null -> Icons.Default.Tag
                        uiState.selectedDm != null -> null // Could be a status indicator
                        else -> null
                    }
                    titleIcon?.let {
                        Icon(
                            it,
                            contentDescription = null,
                            tint = ScrymeDarkTextSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                    }

                    if (uiState.selectedDm != null) {
                        AsyncImage(
                            model = uiState.selectedDm.otherUserAvatar ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=${uiState.selectedDm.dm.otherUserId}",
                            contentDescription = null,
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }

                    Text(
                        text = title,
                        color = ScrymeDarkTextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 17.sp,
                        letterSpacing = 0.1.sp
                    )
                }
            }

            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                this@Column.AnimatedVisibility(
                    visible = isHomeSelected,
                    enter = fadeIn(tween(220)),
                    exit = fadeOut(tween(120))
                ) {
                    EmptyStateScreen(
                        icon = Icons.Default.ChatBubbleOutline,
                        title = "No conversation selected",
                        subtitle = "Choose a direct message or a friend from the menu to pick up where you left off."
                    )
                }

                if (!isHomeSelected && (selectedChannel != null || uiState.selectedDm != null || uiState.isChannelLoading)) {
                    ChatView(
                        chatTitle = title,
                        messages = chatUiState.messages,
                        onSendMessage = onSendMessage,
                        onReply = onReply,
                        onOpenThread = onOpenThread,
                        onForward = onForward,
                        onBack = onBack,
                        isThread = chatUiState.isThread,
                        threadTitle = chatUiState.threadRootMessage?.let { "Thread with ${it.senderName}" },
                        isDm = isDm,
                        onDownload = onDownload,
                        onAction = onAction,
                        onUpdateForm = onUpdateForm,
                        onAttach = onAttach,
                        onRemoveFile = onRemoveFile,
                        isSending = isSending,
                        pendingFiles = pendingFiles,
                        formStates = formStates,
                        loadingActions = loadingActions,
                        onTyping = onTyping,
                        typingUsers = chatUiState.typingUsers,
                        onAvatarClick = onAvatarClick,
                        channels = channels,
                        suggestedUsers = suggestedUsers,
                        onSearchUsers = onSearchUsers,
                        onClearSuggestedUsers = onClearSuggestedUsers,
                        onMentionClick = onMentionClick,
                        onChannelTagClick = onChannelTagClick
                    )
                } else if (!isHomeSelected && selectedChannel == null && selectedWorkspace != null) {
                    WelcomeScreen(workspaceName = selectedWorkspace.name)
                }
            }
        }
    }
}

@Composable
private fun EmptyStateScreen(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 40.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(ScrymeDarkAccent.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = ScrymeDarkAccent,
                modifier = Modifier.size(32.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = title,
            color = ScrymeDarkTextPrimary,
            fontSize = 19.sp,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = subtitle,
            color = ScrymeDarkTextSecondary,
            fontSize = 14.sp,
            lineHeight = 20.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.widthIn(max = 320.dp)
        )
    }
}

@Composable
fun WelcomeScreen(workspaceName: String) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(workspaceName) { visible = true }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        ScrymeDarkAccent.copy(alpha = 0.06f),
                        Color.Transparent
                    ),
                    endY = 480f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        AnimatedVisibility(
            visible = visible,
            enter = fadeIn(tween(260)) + scaleIn(initialScale = 0.96f, animationSpec = tween(260))
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .shadow(8.dp, CircleShape, spotColor = ScrymeDarkAccent)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(
                                    ScrymeDarkAccent,
                                    ScrymeDarkAccent.copy(alpha = 0.7f)
                                )
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = workspaceName.take(1).uppercase(),
                        color = Color.White,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "Welcome to $workspaceName",
                    color = ScrymeDarkTextPrimary,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    letterSpacing = (-0.2).sp
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "This is the beginning of your $workspaceName workspace. Open the menu to select a channel and start the conversation.",
                    color = ScrymeDarkTextSecondary,
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.widthIn(max = 360.dp)
                )

                Spacer(modifier = Modifier.height(28.dp))

                Button(
                    onClick = { /* Could open a channel picker or something */ },
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ScrymeDarkAccent),
                    elevation = ButtonDefaults.buttonElevation(
                        defaultElevation = 0.dp,
                        pressedElevation = 0.dp
                    )
                ) {
                    Text(
                        "Browse Channels",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}
