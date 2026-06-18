package com.scrymechat.android.ui.friends

import androidx.compose.foundation.background
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
import androidx.compose.ui.text.font.FontWeight
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
    viewModel: FriendsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }
    var showAddFriendDialog by remember { mutableStateOf(false) }
    var showInviteDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ScrymeDarkBackground)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.People, contentDescription = null, tint = ScrymeDarkTextSecondary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Friends",
                    color = ScrymeDarkTextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Row {
                IconButton(onClick = { showAddFriendDialog = true }) {
                    Icon(Icons.Default.PersonAdd, contentDescription = "Add Friend", tint = ScrymeDarkTextPrimary)
                }
                IconButton(onClick = { showInviteDialog = true }) {
                    Icon(Icons.Default.Mail, contentDescription = "Invite", tint = ScrymeDarkTextPrimary)
                }
            }
        }

        // Tabs
        ScrollableTabRow(
            selectedTabIndex = selectedTab,
            containerColor = ScrymeDarkBackground,
            contentColor = ScrymeDarkTextPrimary,
            edgePadding = 16.dp,
            divider = {}
        ) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                Text("Online", modifier = Modifier.padding(16.dp))
            }
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                Text("All", modifier = Modifier.padding(16.dp))
            }
            Tab(selected = selectedTab == 2, onClick = { selectedTab = 2 }) {
                Text("Pending", modifier = Modifier.padding(16.dp))
            }
            Tab(selected = selectedTab == 3, onClick = { selectedTab = 3 }) {
                Text("Blocked", modifier = Modifier.padding(16.dp))
            }
        }

        // List
        Box(modifier = Modifier.weight(1f)) {
            if (uiState.isLoading && uiState.friends.isEmpty() && uiState.requests.isEmpty()) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                val displayList = when (selectedTab) {
                    0 -> uiState.friends.filter { it.status != "offline" }
                    1 -> uiState.friends
                    2 -> emptyList()
                    3 -> uiState.friends.filter { it.status == "blocked" } // Assuming blocked status
                    else -> emptyList()
                }

                if (selectedTab == 2) {
                    FriendRequestsList(
                        requests = uiState.requests,
                        onAccept = { viewModel.acceptRequest(it) },
                        onDecline = { viewModel.declineRequest(it) }
                    )
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(displayList) { friend ->
                            FriendItem(user = friend, onDmClick = onDmClick)
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
fun FriendItem(user: UserEntity, onDmClick: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clickable { /* Profile */ },
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar
        Box(modifier = Modifier.size(40.dp)) {
            if (user.avatar != null) {
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
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = user.name, color = ScrymeDarkTextPrimary, fontWeight = FontWeight.Bold)
            Text(text = user.status, color = ScrymeDarkTextSecondary, fontSize = 12.sp)
        }
        IconButton(onClick = { onDmClick(user.id) }) {
            Icon(Icons.Default.Chat, contentDescription = "Message", tint = ScrymeDarkTextSecondary)
        }
    }
}

@Composable
fun FriendRequestsList(
    requests: List<FriendRequestEntity>,
    onAccept: (String) -> Unit,
    onDecline: (String) -> Unit
) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        items(requests) { request ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar placeholder
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color.Gray)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Request from ${request.senderId}", color = ScrymeDarkTextPrimary, fontWeight = FontWeight.Bold)
                    Text(text = request.status, color = ScrymeDarkTextSecondary, fontSize = 12.sp)
                }
                Row {
                    IconButton(onClick = { onAccept(request.id) }) {
                        Icon(Icons.Default.Check, contentDescription = "Accept", tint = Color.Green)
                    }
                    IconButton(onClick = { onDecline(request.id) }) {
                        Icon(Icons.Default.Close, contentDescription = "Decline", tint = Color.Red)
                    }
                }
            }
        }
    }
}

@Composable
fun AddFriendDialog(onDismiss: () -> Unit, onAdd: (String) -> Unit) {
    var username by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Friend") },
        text = {
            TextField(
                value = username,
                onValueChange = { username = it },
                placeholder = { Text("Username") },
                singleLine = true
            )
        },
        confirmButton = {
            Button(onClick = { onAdd(username) }) {
                Text("Send Request")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        },
        containerColor = ScrymeDarkSurface,
        titleContentColor = ScrymeDarkTextPrimary,
        textContentColor = ScrymeDarkTextSecondary
    )
}

@Composable
fun InviteUserDialog(onDismiss: () -> Unit, onInvite: (String) -> Unit) {
    var email by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Invite to Scryme") },
        text = {
            TextField(
                value = email,
                onValueChange = { email = it },
                placeholder = { Text("Email address") },
                singleLine = true
            )
        },
        confirmButton = {
            Button(onClick = { onInvite(email) }) {
                Text("Send Invite")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        },
        containerColor = ScrymeDarkSurface,
        titleContentColor = ScrymeDarkTextPrimary,
        textContentColor = ScrymeDarkTextSecondary
    )
}
