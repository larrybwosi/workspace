package com.scrymechat.android.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.scrymechat.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onNavigateToAccount: () -> Unit,
    onNavigateToUserProfile: () -> Unit,
    onNavigateToPrivacy: () -> Unit,
    onNavigateToDevices: () -> Unit,
    onNavigateToAppearance: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToVoice: () -> Unit,
    onNavigateToLanguage: () -> Unit,
    onNavigateToAuthorizedApps: () -> Unit,
    onLogout: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isLoggedOut) {
        if (uiState.isLoggedOut) {
            onLogout()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ScrymeDarkTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ScrymeDarkSurface)
            )
        },
        containerColor = ScrymeDarkBackground
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // User Header
            item {
                UserHeader(user = uiState.currentUser)
            }

            item { SectionHeader("USER SETTINGS") }
            item {
                SettingsItem(
                    icon = Icons.Default.Person,
                    title = "My Account",
                    onClick = onNavigateToAccount
                )
            }
            item {
                SettingsItem(
                    icon = Icons.Default.AccountCircle,
                    title = "User Profile",
                    onClick = onNavigateToUserProfile
                )
            }
            item {
                SettingsItem(
                    icon = Icons.Default.Security,
                    title = "Privacy & Safety",
                    onClick = onNavigateToPrivacy
                )
            }
            item {
                SettingsItem(
                    icon = Icons.Default.Devices,
                    title = "Devices",
                    onClick = onNavigateToDevices
                )
            }
            item {
                SettingsItem(
                    icon = Icons.Default.Apps,
                    title = "Authorized Apps",
                    onClick = onNavigateToAuthorizedApps
                )
            }

            item { SectionHeader("APP SETTINGS") }
            item {
                SettingsItem(
                    icon = Icons.Default.Palette,
                    title = "Appearance",
                    onClick = onNavigateToAppearance
                )
            }
            item {
                SettingsItem(
                    icon = Icons.Default.Notifications,
                    title = "Notifications",
                    onClick = onNavigateToNotifications
                )
            }
            item {
                SettingsItem(
                    icon = Icons.Default.Mic,
                    title = "Voice",
                    onClick = onNavigateToVoice
                )
            }
            item {
                SettingsItem(
                    icon = Icons.Default.Language,
                    title = "Language",
                    onClick = onNavigateToLanguage
                )
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }

            item {
                SettingsItem(
                    icon = Icons.AutoMirrored.Filled.ExitToApp,
                    title = "Log Out",
                    titleColor = Color.Red,
                    showArrow = false,
                    onClick = { viewModel.logout() }
                )
            }

            item { Spacer(modifier = Modifier.height(32.dp)) }
        }
    }
}

@Composable
fun UserHeader(user: com.scrymechat.android.data.local.entities.UserEntity?) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(ScrymeDarkSurface)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(modifier = Modifier.size(80.dp)) {
            if (user?.avatar != null) {
                AsyncImage(
                    model = user.avatar,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .background(Color.Gray)
                )
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = user?.name ?: "User",
            color = ScrymeDarkTextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = user?.email ?: "",
            color = ScrymeDarkTextSecondary,
            fontSize = 14.sp
        )
    }
}

@Composable
fun SectionHeader(title: String) {
    Text(
        text = title,
        color = ScrymeDarkTextSecondary,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(start = 16.dp, top = 24.dp, bottom = 8.dp)
    )
}

@Composable
fun SettingsItem(
    icon: ImageVector,
    title: String,
    titleColor: Color = ScrymeDarkTextPrimary,
    showArrow: Boolean = true,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        color = ScrymeDarkSurface
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, tint = ScrymeDarkTextSecondary, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Text(text = title, color = titleColor, fontSize = 16.sp, modifier = Modifier.weight(1f))
            if (showArrow) {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = ScrymeDarkTextSecondary)
            }
        }
    }
}
