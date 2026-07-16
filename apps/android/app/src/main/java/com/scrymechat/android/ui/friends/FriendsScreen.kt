package com.scrymechat.android.ui.friends

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.FriendRequestEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.ui.theme.*

@Composable
fun FriendsScreen(
    onDmClick: (String) -> Unit,
    onUserProfileClick: (String) -> Unit = {},
    viewModel: FriendsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }
    var showAddFriendDialog by remember { mutableStateOf(false) }
    var showInviteDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(EnterpriseTokens.SurfaceBase)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.People,
                    contentDescription = null,
                    tint = EnterpriseTokens.TextSecondary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "Friends",
                    color = EnterpriseTokens.TextPrimary,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HeaderActionButton(
                    icon = Icons.Default.PersonAdd,
                    contentDescription = "Add Friend",
                    onClick = { showAddFriendDialog = true }
                )
                HeaderActionButton(
                    icon = Icons.Default.Mail,
                    contentDescription = "Invite",
                    onClick = { showInviteDialog = true }
                )
            }
        }

        HorizontalDivider(color = EnterpriseTokens.Hairline, thickness = 1.dp)

        // Tabs
        ScrollableTabRow(
            selectedTabIndex = selectedTab,
            containerColor = EnterpriseTokens.SurfaceBase,
            contentColor = EnterpriseTokens.Accent,
            edgePadding = 16.dp,
            divider = {}
        ) {
            val tabs = listOf(
                "Online" to (uiState.friends.count { it.status != "offline" }),
                "All" to uiState.friends.size,
                "Pending" to uiState.requests.size,
                "Blocked" to (uiState.friends.count { it.status == "blocked" })
            )
            tabs.forEachIndexed { index, (label, count) ->
                Tab(selected = selectedTab == index, onClick = { selectedTab = index }) {
                    Row(
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = label,
                            fontSize = 14.sp,
                            fontWeight = if (selectedTab == index) FontWeight.SemiBold else FontWeight.Medium,
                            color = if (selectedTab == index) EnterpriseTokens.TextPrimary else EnterpriseTokens.TextSecondary
                        )
                        if (count > 0) {
                            Spacer(modifier = Modifier.width(6.dp))
                            CountPill(count = count, accented = selectedTab == index)
                        }
                    }
                }
            }
        }

        HorizontalDivider(color = EnterpriseTokens.Hairline, thickness = 1.dp)

        // List
        Box(modifier = Modifier.weight(1f)) {
            if (uiState.isLoading && uiState.friends.isEmpty() && uiState.requests.isEmpty()) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = EnterpriseTokens.Accent
                )
            } else {
                val displayList = when (selectedTab) {
                    0 -> uiState.friends.filter { it.status != "offline" }
                    1 -> uiState.friends
                    2 -> emptyList()
                    3 -> uiState.friends.filter { it.status == "blocked" } // Assuming blocked status
                    else -> emptyList()
                }

                if (selectedTab == 2) {
                    if (uiState.requests.isEmpty()) {
                        EmptyState(
                            icon = Icons.Default.MarkEmailRead,
                            title = "No pending requests",
                            subtitle = "Friend requests you receive will show up here."
                        )
                    } else {
                        FriendRequestsList(
                            requests = uiState.requests,
                            onAccept = { viewModel.acceptRequest(it) },
                            onDecline = { viewModel.declineRequest(it) },
                            onProfileClick = onUserProfileClick
                        )
                    }
                } else if (displayList.isEmpty()) {
                    EmptyState(
                        icon = Icons.Default.People,
                        title = when (selectedTab) {
                            0 -> "No one's online"
                            3 -> "No blocked users"
                            else -> "No friends yet"
                        },
                        subtitle = when (selectedTab) {
                            0 -> "Friends who come online will show up here."
                            3 -> "Users you block will be listed here."
                            else -> "Add a friend to start a conversation."
                        }
                    )
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(displayList, key = { it.id }) { friend ->
                            FriendItem(user = friend, onDmClick = onDmClick, onProfileClick = onUserProfileClick)
                        }
                    }
                }
            }
        }
    }

    if (showAddFriendDialog) {
        AddFriendDialog(
            onDismiss = { showAddFriendDialog = false },
            onAdd = { username ->
                viewModel.sendFriendRequest(username)
                showAddFriendDialog = false
            }
        )
    }

    if (showInviteDialog) {
        InviteUserDialog(
            onDismiss = { showInviteDialog = false },
            onInvite = { email ->
                viewModel.inviteUser(email)
                showInviteDialog = false
            }
        )
    }
}

@Composable
private fun HeaderActionButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(RoundedCornerShape(EnterpriseTokens.RadiusChip))
            .background(EnterpriseTokens.SurfaceRaised)
            .border(BorderStroke(1.dp, EnterpriseTokens.Hairline), RoundedCornerShape(EnterpriseTokens.RadiusChip))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = EnterpriseTokens.TextPrimary,
            modifier = Modifier.size(18.dp)
        )
    }
}

@Composable
private fun CountPill(count: Int, accented: Boolean) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(if (accented) EnterpriseTokens.AccentMuted else EnterpriseTokens.NeutralMuted)
            .padding(horizontal = 7.dp, vertical = 1.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = count.toString(),
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (accented) EnterpriseTokens.Accent else EnterpriseTokens.TextSecondary
        )
    }
}

@Composable
private fun EmptyState(icon: ImageVector, title: String, subtitle: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(EnterpriseTokens.SurfaceRaised)
                .border(BorderStroke(1.dp, EnterpriseTokens.Hairline), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = EnterpriseTokens.TextTertiary, modifier = Modifier.size(24.dp))
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = title,
            color = EnterpriseTokens.TextPrimary,
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = subtitle,
            color = EnterpriseTokens.TextSecondary,
            fontSize = 13.sp,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
    }
}

/** Presence dot color derived from a friend's raw status string. */
private fun presenceColor(status: String): Color = when (status.lowercase()) {
    "online" -> EnterpriseTokens.Success
    "idle", "away" -> EnterpriseTokens.Warning
    "dnd", "busy" -> EnterpriseTokens.Destructive
    else -> EnterpriseTokens.Neutral
}

@Composable
private fun Avatar(name: String, avatarUrl: String?, status: String?, size: androidx.compose.ui.unit.Dp = 40.dp, modifier: Modifier = Modifier) {
    Box(modifier = modifier.size(size)) {
        if (avatarUrl != null) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = null,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .border(BorderStroke(1.dp, EnterpriseTokens.HairlineStrong), CircleShape)
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .background(EnterpriseTokens.SurfaceRaised)
                    .border(BorderStroke(1.dp, EnterpriseTokens.HairlineStrong), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = name.firstOrNull()?.uppercaseChar()?.toString() ?: "?",
                    color = EnterpriseTokens.TextSecondary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
        if (status != null) {
            Box(
                modifier = Modifier
                    .size(size * 0.32f)
                    .align(Alignment.BottomEnd)
                    .clip(CircleShape)
                    .background(EnterpriseTokens.SurfaceBase)
                    .padding(2.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .background(presenceColor(status))
                )
            }
        }
    }
}

@Composable
fun FriendItem(user: UserEntity, onDmClick: (String) -> Unit, onProfileClick: (String) -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(EnterpriseTokens.RadiusInner))
            .clickable { onProfileClick(user.id) }
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Avatar(name = user.name, avatarUrl = user.avatar, status = user.status)
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = user.name,
                color = EnterpriseTokens.TextPrimary,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = user.status.replaceFirstChar { it.uppercase() },
                color = EnterpriseTokens.TextSecondary,
                fontSize = 12.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        HeaderActionButton(
            icon = Icons.Default.Chat,
            contentDescription = "Message",
            onClick = { onDmClick(user.id) }
        )
    }
}

@Composable
fun FriendRequestsList(
    requests: List<FriendRequestEntity>,
    onAccept: (String) -> Unit,
    onDecline: (String) -> Unit,
    onProfileClick: (String) -> Unit = {}
) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        items(requests, key = { it.id }) { request ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Avatar(
                    name = request.senderName ?: request.senderId,
                    avatarUrl = request.senderAvatar,
                    status = null,
                    modifier = Modifier.clickable { onProfileClick(request.senderId) }
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Request from ${request.senderName ?: request.senderId}",
                        color = EnterpriseTokens.TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = request.status.replaceFirstChar { it.uppercase() },
                        color = EnterpriseTokens.TextSecondary,
                        fontSize = 12.sp
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    RequestActionButton(
                        icon = Icons.Default.Check,
                        contentDescription = "Accept",
                        color = EnterpriseTokens.Success,
                        mutedColor = EnterpriseTokens.SuccessMuted,
                        onClick = { onAccept(request.id) }
                    )
                    RequestActionButton(
                        icon = Icons.Default.Close,
                        contentDescription = "Decline",
                        color = EnterpriseTokens.Destructive,
                        mutedColor = EnterpriseTokens.DestructiveMuted,
                        onClick = { onDecline(request.id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun RequestActionButton(
    icon: ImageVector,
    contentDescription: String,
    color: Color,
    mutedColor: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(34.dp)
            .clip(CircleShape)
            .background(mutedColor)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, contentDescription = contentDescription, tint = color, modifier = Modifier.size(17.dp))
    }
}

@Composable
fun AddFriendDialog(onDismiss: () -> Unit, onAdd: (String) -> Unit) {
    var username by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(EnterpriseTokens.RadiusOuter),
        title = {
            Text("Add Friend", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
        },
        text = {
            Column {
                Text(
                    text = "Send a friend request by username.",
                    color = EnterpriseTokens.TextSecondary,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    placeholder = { Text("Username") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(EnterpriseTokens.RadiusInner),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = EnterpriseTokens.SurfaceSunken,
                        unfocusedContainerColor = EnterpriseTokens.SurfaceSunken,
                        focusedTextColor = EnterpriseTokens.TextPrimary,
                        unfocusedTextColor = EnterpriseTokens.TextPrimary,
                        focusedBorderColor = EnterpriseTokens.Accent,
                        unfocusedBorderColor = EnterpriseTokens.Hairline,
                        cursorColor = EnterpriseTokens.Accent
                    ),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onAdd(username) },
                enabled = username.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = EnterpriseTokens.Accent,
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(EnterpriseTokens.RadiusInner)
            ) {
                Text("Send Request", fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = EnterpriseTokens.TextSecondary)
            }
        },
        containerColor = ScrymeDarkSurface,
        titleContentColor = EnterpriseTokens.TextPrimary,
        textContentColor = EnterpriseTokens.TextSecondary
    )
}

@Composable
fun InviteUserDialog(onDismiss: () -> Unit, onInvite: (String) -> Unit) {
    var email by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(EnterpriseTokens.RadiusOuter),
        title = {
            Text("Invite to Scryme", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
        },
        text = {
            Column {
                Text(
                    text = "We'll send an email invite to join your workspace.",
                    color = EnterpriseTokens.TextSecondary,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("Email address") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(EnterpriseTokens.RadiusInner),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = EnterpriseTokens.SurfaceSunken,
                        unfocusedContainerColor = EnterpriseTokens.SurfaceSunken,
                        focusedTextColor = EnterpriseTokens.TextPrimary,
                        unfocusedTextColor = EnterpriseTokens.TextPrimary,
                        focusedBorderColor = EnterpriseTokens.Accent,
                        unfocusedBorderColor = EnterpriseTokens.Hairline,
                        cursorColor = EnterpriseTokens.Accent
                    ),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onInvite(email) },
                enabled = email.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = EnterpriseTokens.Accent,
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(EnterpriseTokens.RadiusInner)
            ) {
                Text("Send Invite", fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = EnterpriseTokens.TextSecondary)
            }
        },
        containerColor = ScrymeDarkSurface,
        titleContentColor = EnterpriseTokens.TextPrimary,
        textContentColor = EnterpriseTokens.TextSecondary
    )
}
