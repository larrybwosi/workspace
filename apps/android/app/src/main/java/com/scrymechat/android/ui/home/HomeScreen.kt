package com.scrymechat.android.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scrymechat.android.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    onSettingsClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Color.Transparent,
                drawerTonalElevation = 0.dp,
                modifier = Modifier.width(312.dp) // 72 + 240
            ) {
                Row(modifier = Modifier.fillMaxSize()) {
                    // Left: Workspace Rail
                    WorkspaceRail(
                        workspaces = uiState.workspaces,
                        selectedWorkspace = uiState.selectedWorkspace,
                        isHomeSelected = uiState.isHomeSelected,
                        onWorkspaceClick = {
                            viewModel.selectWorkspace(it)
                            // We don't necessarily close the drawer here if they might want to pick a channel
                        },
                        onHomeClick = {
                            viewModel.selectHome()
                        }
                    )

                    // Middle: Channel Sidebar
                    ChannelSidebar(
                        workspace = uiState.selectedWorkspace,
                        channels = uiState.channels,
                        selectedChannel = uiState.selectedChannel,
                        isHomeSelected = uiState.isHomeSelected,
                        currentUser = uiState.currentUser,
                        expandedCategories = uiState.expandedCategories,
                        onChannelClick = {
                            viewModel.selectChannel(it)
                            scope.launch { drawerState.close() }
                        },
                        onCategoryToggle = { viewModel.toggleCategory(it) },
                        onSettingsClick = onSettingsClick
                    )
                }
            }
        }
    ) {
        // Right: Main Content
        MainContent(
            selectedWorkspace = uiState.selectedWorkspace,
            selectedChannel = uiState.selectedChannel,
            isHomeSelected = uiState.isHomeSelected,
            onMenuClick = { scope.launch { drawerState.open() } },
            modifier = Modifier.fillMaxSize()
        )
    }
}

@Composable
fun MainContent(
    selectedWorkspace: com.scrymechat.android.data.local.entities.WorkspaceEntity?,
    selectedChannel: com.scrymechat.android.data.local.entities.ChannelEntity?,
    isHomeSelected: Boolean,
    onMenuClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(ScrymeDarkSurfaceVariant)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .background(ScrymeDarkSurfaceVariant)
                    .padding(horizontal = 4.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onMenuClick) {
                        Icon(Icons.Default.Menu, contentDescription = "Menu", tint = ScrymeDarkTextPrimary)
                    }
                    Text(
                        text = if (isHomeSelected) "Home" else if (selectedChannel != null) "# ${selectedChannel.name}" else selectedWorkspace?.name ?: "Scrymechat",
                        color = ScrymeDarkTextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            Divider(color = ScrymeDarkBackground, thickness = 1.dp)

            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                if (isHomeSelected) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(32.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "Select a friend or DM to start chatting!",
                            color = ScrymeDarkTextPrimary,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "You're in the Home view. Here you can find your direct conversations and friends list.",
                            color = ScrymeDarkTextSecondary,
                            fontSize = 16.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                } else if (selectedChannel != null) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "Chat messages in #${selectedChannel.name} will appear here.",
                            color = ScrymeDarkTextSecondary
                        )
                    }
                } else if (selectedWorkspace != null) {
                    WelcomeScreen(workspaceName = selectedWorkspace.name)
                }
            }
        }
    }
}

@Composable
fun WelcomeScreen(workspaceName: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Welcome to $workspaceName!",
            color = ScrymeDarkTextPrimary,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "This is the beginning of the $workspaceName workspace. Open the menu on the left to select a channel.",
            color = ScrymeDarkTextSecondary,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = { /* Could open a channel picker or something */ },
            colors = ButtonDefaults.buttonColors(containerColor = ScrymeDarkAccent)
        ) {
            Text("Browse Channels")
        }
    }
}
