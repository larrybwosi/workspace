package com.scrymechat.android.ui.notifications

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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scrymechat.android.data.local.entities.NotificationEntity
import com.scrymechat.android.ui.theme.*
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    viewModel: NotificationsViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onNotificationClick: (NotificationEntity) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = ScrymeDarkTextPrimary)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.markAllAsRead() }) {
                        Icon(Icons.Default.DoneAll, contentDescription = "Mark all as read", tint = ScrymeDarkTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = ScrymeDarkSurface,
                    titleContentColor = ScrymeDarkTextPrimary
                )
            )
        },
        containerColor = ScrymeDarkSurface
    ) { padding ->
        if (uiState.notifications.isEmpty() && !uiState.isLoading) {
            EmptyNotifications(modifier = Modifier.padding(padding))
        } else {
            val groupedNotifications = remember(uiState.notifications) {
                uiState.notifications.groupBy { notification ->
                    val workspaceName = notification.metadata?.get("workspaceName") as? String ?: "Direct Messages"
                    workspaceName
                }
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                groupedNotifications.forEach { (workspace, notifications) ->
                    item {
                        WorkspaceHeader(workspace)
                    }
                    items(notifications) { notification ->
                        NotificationItem(
                            notification = notification,
                            onClick = {
                                viewModel.markAsRead(notification.id)
                                onNotificationClick(notification)
                            }
                        )
                        Divider(
                            color = ScrymeDarkDivider,
                            thickness = 0.5.dp,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun WorkspaceHeader(name: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(ScrymeDarkSurfaceVariant)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(
            text = name.uppercase(),
            style = MaterialTheme.typography.labelMedium,
            color = ScrymeDarkTextSecondary,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
        )
    }
}

@Composable
fun NotificationItem(
    notification: NotificationEntity,
    onClick: () -> Unit
) {
    val icon = when (notification.type) {
        "mention" -> Icons.Default.AlternateEmail
        "direct_message" -> Icons.Default.Mail
        "workspace_invitation" -> Icons.Default.GroupAdd
        else -> Icons.Default.Notifications
    }

    val iconColor = if (notification.isRead) ScrymeDarkTextSecondary else ScrymeDarkAccent

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(if (notification.isRead) Color.Transparent else ScrymeDarkAccent.copy(alpha = 0.05f))
            .padding(16.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(if (notification.isRead) ScrymeDarkSurfaceVariant else ScrymeDarkAccent.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(16.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = notification.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = if (notification.isRead) ScrymeDarkTextPrimary else Color.White,
                    fontWeight = if (notification.isRead) FontWeight.Medium else FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = formatTimestamp(notification.createdAt),
                    style = MaterialTheme.typography.bodySmall,
                    color = ScrymeDarkTextSecondary
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = notification.message,
                style = MaterialTheme.typography.bodyMedium,
                color = ScrymeDarkTextSecondary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }

        if (!notification.isRead) {
            Box(
                modifier = Modifier
                    .padding(start = 8.dp, top = 4.dp)
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(ScrymeDarkAccent)
            )
        }
    }
}

@Composable
fun EmptyNotifications(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.NotificationsNone,
            contentDescription = null,
            tint = ScrymeDarkTextSecondary,
            modifier = Modifier.size(64.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No notifications yet",
            style = MaterialTheme.typography.titleMedium,
            color = ScrymeDarkTextPrimary
        )
        Text(
            text = "We'll let you know when something happens.",
            style = MaterialTheme.typography.bodyMedium,
            color = ScrymeDarkTextSecondary
        )
    }
}

private fun formatTimestamp(timestamp: String): String {
    return try {
        val instant = Instant.parse(timestamp)
        val now = Instant.now()
        val formatter = if (instant.atZone(ZoneId.systemDefault()).toLocalDate() == now.atZone(ZoneId.systemDefault()).toLocalDate()) {
            DateTimeFormatter.ofPattern("HH:mm", Locale.getDefault())
        } else {
            DateTimeFormatter.ofPattern("MMM dd", Locale.getDefault())
        }
        instant.atZone(ZoneId.systemDefault()).format(formatter)
    } catch (e: Exception) {
        timestamp
    }
}
