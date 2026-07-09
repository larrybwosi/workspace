package com.scrymechat.android.ui.profile

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.AlternateEmail
import androidx.compose.material.icons.outlined.Badge
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.remote.SocialProfileDto

// -----------------------------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OtherUserProfileScreen(
    userId: String,
    onBack: () -> Unit,
    onSendMessage: (String) -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val user by viewModel.targetUser.collectAsState()
    val socialProfile by viewModel.socialProfile.collectAsState()
    val isLoading by viewModel.isLoadingTarget.collectAsState()
    val palette = profilePalette()

    LaunchedEffect(userId) {
        viewModel.fetchUser(userId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    AnimatedVisibility(visible = !isLoading && user != null, enter = fadeIn(), exit = fadeOut()) {
                        Text(
                            user?.name ?: "",
                            color = palette.textPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 16.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
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
        when {
            isLoading -> LoadingState(padding, palette)
            user != null -> ProfileContent(
                userId = userId,
                user = user,
                socialProfile = socialProfile,
                onSendMessage = onSendMessage,
                viewModel = viewModel,
                palette = palette,
                padding = padding
            )
            else -> EmptyState(padding, palette)
        }
    }
}

@Composable
private fun LoadingState(padding: PaddingValues, palette: ProfilePalette) {
    Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = palette.accent, strokeWidth = 2.5.dp)
    }
}

@Composable
private fun EmptyState(padding: PaddingValues, palette: ProfilePalette) {
    Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                Icons.Default.PersonOff,
                contentDescription = null,
                tint = palette.textTertiary,
                modifier = Modifier.size(36.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text("User not found", color = palette.textSecondary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun ProfileContent(
    userId: String,
    user: UserEntity?,
    socialProfile: SocialProfileDto?,
    onSendMessage: (String) -> Unit,
    viewModel: ProfileViewModel,
    palette: ProfilePalette,
    padding: PaddingValues
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item { ProfileHeaderSection(user = user, palette = palette) }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(top = 20.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                SocialActionSection(
                    userId = userId,
                    socialProfile = socialProfile,
                    onSendMessage = onSendMessage,
                    onAddFriend = { viewModel.sendFriendRequest(userId) },
                    onAcceptFriend = { requestId -> viewModel.acceptFriendRequest(requestId, userId) },
                    onCancelRequest = { requestId -> viewModel.cancelFriendRequest(requestId, userId) },
                    palette = palette
                )

                if (!user?.bio.isNullOrEmpty()) {
                    ProfileInfoCard(title = "About", icon = Icons.Outlined.Info, palette = palette) {
                        Text(
                            text = user?.bio!!,
                            color = palette.textPrimary,
                            fontSize = 14.sp,
                            lineHeight = 21.sp
                        )
                    }
                }

                ProfileInfoCard(title = "Details", icon = Icons.Outlined.Badge, palette = palette) {
                    InfoRow(icon = Icons.Outlined.AlternateEmail, label = "Username", value = user?.username?.let { "@$it" } ?: "unknown", palette = palette)
                    RowDivider(palette)
                    InfoRow(icon = Icons.Outlined.Circle, label = "Status", value = (user?.status ?: "offline").replaceFirstChar { it.uppercase() }, palette = palette)
                    RowDivider(palette)
                    InfoRow(icon = Icons.Outlined.Shield, label = "Role", value = user?.role ?: "Member", palette = palette)
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------------------------
// Header — banner, avatar with live status dot, name, role badge
// -----------------------------------------------------------------------------------------------

@Composable
fun ProfileHeaderSection(user: UserEntity?, palette: ProfilePalette) {
    Box(modifier = Modifier.fillMaxWidth()) {
        Column {
            // Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(148.dp)
                    .then(
                        if (user?.banner == null)
                            Modifier.background(Brush.linearGradient(palette.headerGradient))
                        else
                            Modifier.background(palette.cardSurface)
                    )
            ) {
                user?.banner?.let { bannerUrl ->
                    AsyncImage(
                        model = bannerUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.Transparent, palette.canvasBg.copy(alpha = 0.25f)),
                                startY = 60f
                            )
                        )
                )
            }

            // Spacer to make room for the avatar, which overlaps banner + body
            Spacer(modifier = Modifier.height(52.dp))
        }

        // Avatar — overlaps banner bottom edge, Discord-style
        Box(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(start = 20.dp)
                .padding(top = 148.dp - 44.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .shadow(elevation = 6.dp, shape = CircleShape, clip = false)
                    .clip(CircleShape)
                    .background(palette.canvasBg)
                    .padding(4.dp)
                    .clip(CircleShape)
            ) {
                user?.avatar?.let { avatarUrl ->
                    AsyncImage(
                        model = avatarUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize().clip(CircleShape)
                    )
                } ?: run {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(Brush.linearGradient(palette.accentGradient)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            (user?.name?.firstOrNull() ?: 'U').toString().uppercase(),
                            color = Color.White,
                            fontSize = 34.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Live status indicator
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(22.dp)
                    .clip(CircleShape)
                    .background(palette.canvasBg),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(15.dp)
                        .clip(CircleShape)
                        .background(statusColor(user?.status, palette))
                )
            }
        }

        // Name + role badge, sitting to the right of / below the avatar
        Column(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(start = 20.dp)
                .padding(top = 148.dp + 8.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    user?.name ?: "",
                    color = palette.textPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 21.sp,
                    letterSpacing = (-0.3).sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                val role = user?.role
                if (!role.isNullOrEmpty() && !role.equals("Member", ignoreCase = true)) {
                    Spacer(modifier = Modifier.width(8.dp))
                    RoleBadge(role = role, palette = palette)
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            Text(
                text = "@${user?.username ?: "unknown"}",
                color = palette.textTertiary,
                fontSize = 13.sp
            )

            if (user?.statusText?.isNotEmpty() == true) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    user.statusText!!,
                    color = palette.textSecondary,
                    fontSize = 13.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun RoleBadge(role: String, palette: ProfilePalette) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = palette.accent.copy(alpha = 0.14f),
        border = androidx.compose.foundation.BorderStroke(1.dp, palette.accent.copy(alpha = 0.35f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Filled.Verified,
                contentDescription = null,
                tint = palette.accent,
                modifier = Modifier.size(12.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                role,
                color = palette.accent,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.2.sp
            )
        }
    }
}

private fun statusColor(status: String?, palette: ProfilePalette): Color = when (status?.lowercase()) {
    "online", "active" -> palette.statusOnline
    "idle", "away" -> palette.statusIdle
    "dnd", "busy", "do_not_disturb" -> palette.statusDnd
    else -> palette.statusOffline
}

// -----------------------------------------------------------------------------------------------
// Info cards
// -----------------------------------------------------------------------------------------------

@Composable
fun ProfileInfoCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    palette: ProfilePalette,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = palette.textTertiary, modifier = Modifier.size(14.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = title.uppercase(),
                color = palette.textTertiary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.8.sp
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(elevation = 1.dp, shape = RoundedCornerShape(14.dp), clip = false),
            shape = RoundedCornerShape(14.dp),
            color = palette.cardSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, palette.cardBorder)
        ) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp), content = content)
        }
    }
}

@Composable
fun RowDivider(palette: ProfilePalette) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 10.dp)
            .height(1.dp)
            .background(palette.cardBorder)
    )
}

@Composable
fun InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String, palette: ProfilePalette) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = palette.textTertiary, modifier = Modifier.size(15.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(label, color = palette.textSecondary, fontSize = 13.5.sp)
        }
        Text(
            value,
            color = palette.textPrimary,
            fontSize = 13.5.sp,
            fontWeight = FontWeight.Medium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

// -----------------------------------------------------------------------------------------------
// Actions — primary / tonal / outlined button hierarchy
// -----------------------------------------------------------------------------------------------

@Composable
fun SocialActionSection(
    userId: String,
    socialProfile: SocialProfileDto?,
    onSendMessage: (String) -> Unit,
    onAddFriend: () -> Unit,
    onAcceptFriend: (String) -> Unit,
    onCancelRequest: (String) -> Unit,
    palette: ProfilePalette
) {
    if (socialProfile == null) {
        PrimaryActionButton(
            label = "Message",
            icon = Icons.AutoMirrored.Filled.Message,
            palette = palette,
            onClick = { onSendMessage(userId) }
        )
        return
    }

    when {
        socialProfile.isFriend -> {
            PrimaryActionButton(
                label = "Message",
                icon = Icons.AutoMirrored.Filled.Message,
                palette = palette,
                onClick = { onSendMessage(userId) }
            )
        }
        socialProfile.friendRequestStatus == "pending" -> {
            if (socialProfile.friendRequestSide == "sender") {
                OutlinedActionButton(
                    label = "Cancel Request",
                    icon = Icons.Default.HourglassEmpty,
                    palette = palette,
                    onClick = { socialProfile.friendRequestId?.let { onCancelRequest(it) } }
                )
            } else {
                PrimaryActionButton(
                    label = "Accept Request",
                    icon = Icons.Default.PersonAdd,
                    palette = palette,
                    onClick = { socialProfile.friendRequestId?.let { onAcceptFriend(it) } }
                )
            }
        }
        else -> {
            PrimaryActionButton(
                label = "Add Friend",
                icon = Icons.Default.PersonAdd,
                palette = palette,
                onClick = onAddFriend
            )
        }
    }
}

@Composable
private fun PrimaryActionButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    palette: ProfilePalette,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(46.dp),
        shape = RoundedCornerShape(11.dp),
        colors = ButtonDefaults.buttonColors(containerColor = palette.accent),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(17.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Text(label, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
    }
}

@Composable
private fun OutlinedActionButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    palette: ProfilePalette,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(46.dp),
        shape = RoundedCornerShape(11.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, palette.cardBorder),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = palette.textSecondary)
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(17.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Text(label, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
    }
}
