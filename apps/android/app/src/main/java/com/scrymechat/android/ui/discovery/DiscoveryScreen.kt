package com.scrymechat.android.ui.discovery

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.scrymechat.android.data.remote.UserDto
import com.scrymechat.android.data.remote.WorkspaceDto
import com.scrymechat.android.ui.home.CreateWorkspaceDialog
import com.scrymechat.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoveryScreen(
    onBack: () -> Unit,
    onNavigateToWorkspace: (String) -> Unit,
    onDmClick: (String) -> Unit,
    onUserProfileClick: (String) -> Unit = {},
    viewModel: DiscoveryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.joinedWorkspaceSlug) {
        uiState.joinedWorkspaceSlug?.let { slug ->
            onNavigateToWorkspace(slug)
            viewModel.clearJoinedStatus()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Discovery", fontSize = 18.sp, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.setCreateWorkspaceDialogOpen(true) }) {
                        Icon(Icons.Default.Add, contentDescription = "Create Workspace")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = EnterpriseTokens.SurfaceBase,
                    titleContentColor = EnterpriseTokens.TextPrimary,
                    navigationIconContentColor = EnterpriseTokens.TextPrimary
                )
            )
        },
        containerColor = EnterpriseTokens.SurfaceBase
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Search Bar
            SearchBar(
                query = uiState.searchQuery,
                onQueryChange = { viewModel.onSearchQueryChanged(it) },
                placeholder = if (uiState.selectedTab == 0) "Search public workspaces..." else "Search users by name or username..."
            )

            // Tabs
            TabRow(
                selectedTabIndex = uiState.selectedTab,
                containerColor = EnterpriseTokens.SurfaceBase,
                contentColor = EnterpriseTokens.Accent,
                divider = { HorizontalDivider(color = EnterpriseTokens.Hairline) }
            ) {
                Tab(
                    selected = uiState.selectedTab == 0,
                    onClick = { viewModel.setTab(0) },
                    text = { Text("Workspaces") }
                )
                Tab(
                    selected = uiState.selectedTab == 1,
                    onClick = { viewModel.setTab(1) },
                    text = { Text("Users") }
                )
            }

            // Content
            Box(modifier = Modifier.weight(1f)) {
                if (uiState.selectedTab == 0) {
                    WorkspaceDiscoveryList(
                        workspaces = uiState.workspaces,
                        isLoading = uiState.isLoading,
                        isJoining = uiState.isJoining,
                        onJoin = { viewModel.joinWorkspace(it) }
                    )
                } else {
                    UserSearchList(
                        users = uiState.users,
                        isSearching = uiState.isSearching,
                        onAddFriend = { viewModel.sendFriendRequest(it) },
                        onMessage = onDmClick,
                        onProfileClick = onUserProfileClick
                    )
                }

                if (uiState.error != null) {
                    ErrorMessage(
                        message = uiState.error!!,
                        onDismiss = { viewModel.clearError() },
                        modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp)
                    )
                }
            }
        }
    }

    if (uiState.isCreateWorkspaceDialogOpen) {
        CreateWorkspaceDialog(
            onDismiss = { viewModel.setCreateWorkspaceDialogOpen(false) },
            onCreate = { viewModel.createWorkspace(it) },
            isLoading = uiState.isCreatingWorkspace
        )
    }
}

@Composable
fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    placeholder: String
) {
    TextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clip(RoundedCornerShape(EnterpriseTokens.RadiusChip))
            .border(BorderStroke(1.dp, EnterpriseTokens.Hairline), RoundedCornerShape(EnterpriseTokens.RadiusChip)),
        placeholder = { Text(placeholder, fontSize = 14.sp, color = EnterpriseTokens.TextTertiary) },
        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = EnterpriseTokens.TextTertiary) },
        trailingIcon = if (query.isNotEmpty()) {
            { IconButton(onClick = { onQueryChange("") }) { Icon(Icons.Default.Clear, contentDescription = "Clear") } }
        } else null,
        colors = TextFieldDefaults.colors(
            focusedContainerColor = EnterpriseTokens.SurfaceSunken,
            unfocusedContainerColor = EnterpriseTokens.SurfaceSunken,
            disabledContainerColor = EnterpriseTokens.SurfaceSunken,
            focusedIndicatorColor = Color.Transparent,
            unfocusedIndicatorColor = Color.Transparent,
            cursorColor = EnterpriseTokens.Accent
        ),
        singleLine = true
    )
}

@Composable
fun WorkspaceDiscoveryList(
    workspaces: List<WorkspaceDto>,
    isLoading: Boolean,
    isJoining: Boolean,
    onJoin: (String) -> Unit
) {
    if (isLoading && workspaces.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = EnterpriseTokens.Accent)
        }
    } else if (workspaces.isEmpty()) {
        DiscoveryEmptyState(
            icon = Icons.Default.Explore,
            title = "No workspaces found",
            subtitle = "Try adjusting your search or explore featured communities."
        )
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(workspaces) { workspace ->
                WorkspaceDiscoveryItem(
                    workspace = workspace,
                    isJoining = isJoining,
                    onJoin = { onJoin(workspace.slug) }
                )
            }
        }
    }
}

@Composable
fun WorkspaceDiscoveryItem(
    workspace: WorkspaceDto,
    isJoining: Boolean,
    onJoin: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = EnterpriseTokens.SurfaceRaised),
        border = BorderStroke(1.dp, EnterpriseTokens.Hairline)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Surface(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp)),
                color = EnterpriseTokens.SurfaceSunken
            ) {
                if (workspace.icon != null) {
                    AsyncImage(
                        model = workspace.icon,
                        contentDescription = workspace.name,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(contentAlignment = Alignment.Center) {
                        Text(workspace.name.take(1).uppercase(), fontWeight = FontWeight.Bold, color = EnterpriseTokens.TextPrimary)
                    }
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = workspace.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = EnterpriseTokens.TextPrimary
                )
                Text(
                    text = workspace.description ?: "No description provided.",
                    fontSize = 13.sp,
                    color = EnterpriseTokens.TextSecondary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.People, contentDescription = null, modifier = Modifier.size(12.dp), tint = EnterpriseTokens.TextTertiary)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${workspace._count?.members ?: 0} members",
                        fontSize = 12.sp,
                        color = EnterpriseTokens.TextTertiary
                    )
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            Button(
                onClick = onJoin,
                enabled = !isJoining,
                colors = ButtonDefaults.buttonColors(containerColor = EnterpriseTokens.Accent),
                contentPadding = PaddingValues(horizontal = 16.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Join", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            }
        }
    }
}

@Composable
fun UserSearchList(
    users: List<UserDto>,
    isSearching: Boolean,
    onAddFriend: (String) -> Unit,
    onMessage: (String) -> Unit,
    onProfileClick: (String) -> Unit = {}
) {
    if (isSearching && users.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = EnterpriseTokens.Accent)
        }
    } else if (users.isEmpty()) {
        DiscoveryEmptyState(
            icon = Icons.Default.PersonSearch,
            title = "Search for people",
            subtitle = "Find friends by their name or @username to start chatting."
        )
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp)
        ) {
            items(users) { user ->
                UserSearchItem(
                    user = user,
                    onAddFriend = { onAddFriend(user.id) },
                    onMessage = { onMessage(user.id) },
                    onProfileClick = onProfileClick
                )
                HorizontalDivider(color = EnterpriseTokens.Hairline, modifier = Modifier.padding(vertical = 4.dp))
            }
        }
    }
}

@Composable
fun UserSearchItem(
    user: UserDto,
    onAddFriend: () -> Unit,
    onMessage: () -> Unit,
    onProfileClick: (String) -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onProfileClick(user.id) }
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar
        Box(modifier = Modifier.size(44.dp)) {
            if (user.avatar != null) {
                AsyncImage(
                    model = user.avatar,
                    contentDescription = user.name,
                    modifier = Modifier.fillMaxSize().clip(CircleShape)
                )
            } else {
                Surface(
                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                    color = EnterpriseTokens.SurfaceSunken
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(user.name.take(1).uppercase(), fontWeight = FontWeight.Bold, color = EnterpriseTokens.TextPrimary)
                    }
                }
            }

            // Online status indicator if available
            if (user.status != null && user.status != "offline") {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .align(Alignment.BottomEnd)
                        .clip(CircleShape)
                        .background(EnterpriseTokens.SurfaceBase)
                        .padding(2.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(if (user.status == "online") EnterpriseTokens.Success else EnterpriseTokens.Warning)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.width(16.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = user.name,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = EnterpriseTokens.TextPrimary
            )
            if (user.username != null) {
                Text(
                    text = "@${user.username}",
                    fontSize = 13.sp,
                    color = EnterpriseTokens.TextSecondary
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            IconButton(
                onClick = onAddFriend,
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(EnterpriseTokens.SurfaceSunken)
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = "Add Friend", modifier = Modifier.size(18.dp), tint = EnterpriseTokens.TextPrimary)
            }
            IconButton(
                onClick = onMessage,
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(EnterpriseTokens.AccentMuted)
            ) {
                Icon(Icons.Default.Chat, contentDescription = "Message", modifier = Modifier.size(18.dp), tint = EnterpriseTokens.Accent)
            }
        }
    }
}

@Composable
fun DiscoveryEmptyState(icon: ImageVector, title: String, subtitle: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = EnterpriseTokens.TextTertiary.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = title,
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp,
            color = EnterpriseTokens.TextPrimary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = subtitle,
            fontSize = 14.sp,
            color = EnterpriseTokens.TextSecondary,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
    }
}

@Composable
fun ErrorMessage(message: String, onDismiss: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = EnterpriseTokens.Destructive,
        shape = RoundedCornerShape(8.dp),
        tonalElevation = 4.dp
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Error, contentDescription = null, tint = Color.White)
            Spacer(modifier = Modifier.width(12.dp))
            Text(text = message, color = Color.White, modifier = Modifier.weight(1f), fontSize = 14.sp)
            IconButton(onClick = onDismiss) {
                Icon(Icons.Default.Close, contentDescription = "Dismiss", tint = Color.White)
            }
        }
    }
}
