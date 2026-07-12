package com.scrymechat.android.ui.notifications

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.GroupAdd
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scrymechat.android.data.local.entities.NotificationEntity
import com.scrymechat.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationDetailScreen(
    notificationId: String,
    viewModel: NotificationsViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onNavigateToChannel: (String, String?) -> Unit,
    onNavigateToDm: (String) -> Unit
) {
    val notification by viewModel.getNotificationById(notificationId).collectAsState(initial = null)

    // Mark as read when opening the detail screen
    LaunchedEffect(notificationId) {
        viewModel.markAsRead(notificationId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notification Details", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = ScrymeDarkTextPrimary
                        )
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
        val currentNotification = notification

        if (currentNotification == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = ScrymeDarkAccent)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Top
            ) {
                Spacer(modifier = Modifier.height(32.dp))

                // Large Decorative Icon
                val icon = when (currentNotification.type) {
                    "mention" -> Icons.Default.AlternateEmail
                    "direct_message" -> Icons.Default.Mail
                    "friend_request", "workspace_invitation" -> Icons.Default.GroupAdd
                    else -> Icons.Default.Notifications
                }

                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(ScrymeDarkAccent.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = ScrymeDarkAccent,
                        modifier = Modifier.size(40.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Title
                Text(
                    text = currentNotification.title,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Message Body inside a Discord-style Card
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = ScrymeDarkSurfaceVariant,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.Start
                    ) {
                        Text(
                            text = currentNotification.message,
                            fontSize = 15.sp,
                            lineHeight = 22.sp,
                            color = ScrymeDarkTextPrimary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Action buttons based on notification type
                val isFriendRequest = currentNotification.type == "friend_request" || currentNotification.entityType == "friend_request"

                if (isFriendRequest) {
                    val requestId = currentNotification.entityId ?: ""
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Accept Button
                        Button(
                            onClick = {
                                viewModel.acceptFriendRequest(requestId, currentNotification.id)
                                onBack()
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = ScrymeDarkAccent
                            )
                        ) {
                            Text(
                                text = "Accept",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        // Reject / Decline Button
                        OutlinedButton(
                            onClick = {
                                viewModel.declineFriendRequest(requestId, currentNotification.id)
                                onBack()
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp),
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, Color(0xFFF23F43)),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color(0xFFF23F43)
                            )
                        ) {
                            Text(
                                text = "Reject",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                } else if (currentNotification.entityId != null) {
                    // Navigate Option for channels or direct messages
                    val buttonText = when (currentNotification.entityType) {
                        "channel" -> "Go to Channel"
                        "direct_message" -> "Open Chat"
                        else -> "View Conversation"
                    }

                    Button(
                        onClick = {
                            when (currentNotification.entityType) {
                                "channel" -> {
                                    val slug = currentNotification.metadata?.get("workspaceSlug") as? String
                                    onNavigateToChannel(currentNotification.entityId, slug)
                                }
                                "direct_message" -> {
                                    onNavigateToDm(currentNotification.entityId)
                                }
                                else -> {
                                    onBack()
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ScrymeDarkAccent
                        )
                    ) {
                        Text(
                            text = buttonText,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}
