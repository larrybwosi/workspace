package com.scrymechat.android.ui.profile

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.UserEntity

// ─── Theme-aware palette ─────────────────────────────────────────────────────
// Same system as the login screen and chat view: a single palette object
// derived from isSystemInDarkTheme(), rather than hardcoded ScrymeDark*
// tokens that forced dark mode regardless of the device setting.

data class ProfilePalette(
    val isDark: Boolean,
    val canvasBg: Color,
    val cardSurface: Color,
    val cardBorder: Color,
    val headerGradient: List<Color>,
    val iconChipBg: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textTertiary: Color,
    val accent: Color,
    val accentGradient: List<Color>,
    val divider: Color,
    val danger: Color,
    val dangerSoft: Color,
    val avatarRing: Color,
    val topBarBg: Color,
    val statusOnline: Color,
    val statusIdle: Color,
    val statusDnd: Color,
    val statusOffline: Color,
)

@Composable
fun profilePalette(isDark: Boolean = isSystemInDarkTheme()): ProfilePalette {
    return if (isDark) {
        ProfilePalette(
            isDark = true,
            canvasBg = Color(0xFF0A0B10),
            cardSurface = Color(0xFF15171F),
            cardBorder = Color.White.copy(alpha = 0.07f),
            headerGradient = listOf(Color(0xFF1E1B4B).copy(alpha = 0.7f), Color(0xFF0A0B10)),
            iconChipBg = Color.White.copy(alpha = 0.05f),
            textPrimary = Color(0xFFF4F5F8),
            textSecondary = Color(0xFF9CA3B5),
            textTertiary = Color(0xFF6B7280),
            accent = Color(0xFF818CF8),
            accentGradient = listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)),
            divider = Color.White.copy(alpha = 0.06f),
            danger = Color(0xFFF87171),
            dangerSoft = Color(0xFFF87171).copy(alpha = 0.12f),
            avatarRing = Color(0xFF818CF8).copy(alpha = 0.5f),
            topBarBg = Color(0xFF0A0B10),
            statusOnline = Color(0xFF23A55A),
            statusIdle = Color(0xFFF0B232),
            statusDnd = Color(0xFFF23F43),
            statusOffline = Color(0xFF80848E),
        )
    } else {
        ProfilePalette(
            isDark = false,
            canvasBg = Color(0xFFF6F7FB),
            cardSurface = Color.White,
            cardBorder = Color(0xFFEDEEF6),
            headerGradient = listOf(Color(0xFFEEF0FF), Color(0xFFF6F7FB)),
            iconChipBg = Color(0xFFF1F1FA),
            textPrimary = Color(0xFF11121A),
            textSecondary = Color(0xFF676B80),
            textTertiary = Color(0xFF9598A8),
            accent = Color(0xFF5B54E0),
            accentGradient = listOf(Color(0xFF4F46E5), Color(0xFF7C3AED)),
            divider = Color(0xFFEEEFF6),
            danger = Color(0xFFDC2626),
            dangerSoft = Color(0xFFDC2626).copy(alpha = 0.08f),
            avatarRing = Color(0xFF5B54E0).copy(alpha = 0.35f),
            topBarBg = Color(0xFFF6F7FB),
            statusOnline = Color(0xFF23A55A),
            statusIdle = Color(0xFFF0B232),
            statusDnd = Color(0xFFF23F43),
            statusOffline = Color(0xFF80848E),
        )
    }
}

private val ShapeCard = RoundedCornerShape(16.dp)
private val ShapeIconChip = RoundedCornerShape(10.dp)

// ──────────────────────────────────────────────────────────────────────────

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
    val palette = profilePalette()
    var showLogoutConfirm by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.isLoggedOut) {
        if (uiState.isLoggedOut) {
            onLogout()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Settings",
                        color = palette.textPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(palette.iconChipBg),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = palette.textPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
            )
        },
        containerColor = palette.canvasBg
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            item {
                UserHeader(user = uiState.currentUser, palette = palette)
            }

            item { Spacer(modifier = Modifier.height(28.dp)) }

            item { SectionHeader("USER SETTINGS", palette) }
            item {
                SettingsCard(palette = palette) {
                    SettingsItem(
                        icon = Icons.Default.Person,
                        title = "My Account",
                        palette = palette,
                        onClick = onNavigateToAccount
                    )
                    SettingsDivider(palette)
                    SettingsItem(
                        icon = Icons.Default.AccountCircle,
                        title = "User Profile",
                        palette = palette,
                        onClick = onNavigateToUserProfile
                    )
                    SettingsDivider(palette)
                    SettingsItem(
                        icon = Icons.Default.Security,
                        title = "Privacy & Safety",
                        palette = palette,
                        onClick = onNavigateToPrivacy
                    )
                    SettingsDivider(palette)
                    SettingsItem(
                        icon = Icons.Default.Devices,
                        title = "Devices",
                        palette = palette,
                        onClick = onNavigateToDevices
                    )
                    SettingsDivider(palette)
                    SettingsItem(
                        icon = Icons.Default.Apps,
                        title = "Authorized Apps",
                        palette = palette,
                        onClick = onNavigateToAuthorizedApps
                    )
                }
            }

            item { SectionHeader("APP SETTINGS", palette) }
            item {
                SettingsCard(palette = palette) {
                    SettingsItem(
                        icon = Icons.Default.Palette,
                        title = "Appearance",
                        palette = palette,
                        onClick = onNavigateToAppearance
                    )
                    SettingsDivider(palette)
                    SettingsItem(
                        icon = Icons.Default.Notifications,
                        title = "Notifications",
                        palette = palette,
                        onClick = onNavigateToNotifications
                    )
                    SettingsDivider(palette)
                    SettingsItem(
                        icon = Icons.Default.Mic,
                        title = "Voice",
                        palette = palette,
                        onClick = onNavigateToVoice
                    )
                    SettingsDivider(palette)
                    SettingsItem(
                        icon = Icons.Default.Language,
                        title = "Language",
                        palette = palette,
                        onClick = onNavigateToLanguage
                    )
                }
            }

            item { Spacer(modifier = Modifier.height(20.dp)) }

            item {
                SettingsCard(palette = palette) {
                    SettingsItem(
                        icon = Icons.AutoMirrored.Filled.ExitToApp,
                        title = "Log Out",
                        palette = palette,
                        titleColor = palette.danger,
                        iconColor = palette.danger,
                        iconBg = palette.dangerSoft,
                        showArrow = false,
                        onClick = { showLogoutConfirm = true }
                    )
                }
            }

            item { Spacer(modifier = Modifier.height(40.dp)) }
        }
    }

    if (showLogoutConfirm) {
        LogoutConfirmDialog(
            palette = palette,
            onConfirm = {
                showLogoutConfirm = false
                viewModel.logout()
            },
            onDismiss = { showLogoutConfirm = false }
        )
    }
}

@Composable
private fun LogoutConfirmDialog(
    palette: ProfilePalette,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = palette.cardSurface,
        shape = RoundedCornerShape(20.dp),
        icon = {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(palette.dangerSoft),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.ExitToApp,
                    contentDescription = null,
                    tint = palette.danger,
                    modifier = Modifier.size(22.dp)
                )
            }
        },
        title = {
            Text(
                "Log out of Scrymechat?",
                color = palette.textPrimary,
                fontWeight = FontWeight.SemiBold,
                fontSize = 17.sp
            )
        },
        text = {
            Text(
                "You'll need to sign in again to access your workspace and messages.",
                color = palette.textSecondary,
                fontSize = 14.sp,
                lineHeight = 20.sp
            )
        },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("Log Out", color = palette.danger, fontWeight = FontWeight.SemiBold, fontSize = 14.5.sp)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = palette.textSecondary, fontSize = 14.5.sp)
            }
        }
    )
}

@Composable
fun UserHeader(user: UserEntity?, palette: ProfilePalette) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.verticalGradient(palette.headerGradient))
            .border(1.dp, palette.cardBorder, RoundedCornerShape(20.dp))
            .padding(vertical = 28.dp, horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(88.dp)
                .clip(CircleShape)
                .border(2.dp, palette.avatarRing, CircleShape)
                .padding(3.dp),
            contentAlignment = Alignment.Center
        ) {
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
                        .background(Brush.linearGradient(palette.accentGradient)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = (user?.name?.firstOrNull() ?: 'U').uppercase(),
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
        Spacer(modifier = Modifier.height(14.dp))
        Text(
            text = user?.name ?: "User",
            color = palette.textPrimary,
            fontSize = 19.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = (-0.2).sp
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = user?.email ?: "",
            color = palette.textSecondary,
            fontSize = 13.5.sp
        )
    }
}

@Composable
fun SectionHeader(title: String, palette: ProfilePalette) {
    Text(
        text = title,
        color = palette.textTertiary,
        fontSize = 11.5.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.6.sp,
        modifier = Modifier.padding(start = 4.dp, top = 8.dp, bottom = 10.dp)
    )
}

@Composable
private fun SettingsCard(
    palette: ProfilePalette,
    content: @Composable ColumnScope.() -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = ShapeCard,
        color = palette.cardSurface,
        border = BorderStroke(1.dp, palette.cardBorder),
        shadowElevation = if (palette.isDark) 0.dp else 2.dp
    ) {
        Column(content = content)
    }
}

@Composable
private fun SettingsDivider(palette: ProfilePalette) {
    Spacer(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .padding(start = 56.dp)
            .background(palette.divider)
    )
}

@Composable
fun SettingsItem(
    icon: ImageVector,
    title: String,
    palette: ProfilePalette,
    titleColor: Color = palette.textPrimary,
    iconColor: Color = palette.textSecondary,
    iconBg: Color = palette.iconChipBg,
    showArrow: Boolean = true,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        color = Color.Transparent
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 14.dp, vertical = 13.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(ShapeIconChip)
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(18.dp))
            }
            Spacer(modifier = Modifier.width(14.dp))
            Text(
                text = title,
                color = titleColor,
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.weight(1f)
            )
            if (showArrow) {
                Icon(
                    Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = null,
                    tint = palette.textTertiary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
