package com.scrymechat.android.ui.chat

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.MessageEntity
import com.scrymechat.android.data.remote.AttachmentDto
import com.scrymechat.android.ui.components.GraphComponent
import com.scrymechat.android.ui.components.MarkdownText
import com.scrymechat.android.ui.components.PollComponent
import com.scrymechat.android.ui.components.PollOption
import com.scrymechat.android.ui.theme.*
import kotlin.math.roundToInt

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ChatView(
    messages: List<MessageEntity>,
    onSendMessage: (String, String?) -> Unit,
    onReply: (MessageEntity) -> Unit,
    onForward: (MessageEntity) -> Unit,
    onDownload: (AttachmentDto) -> Unit = {},
    onTyping: () -> Unit = {},
    typingUsers: List<String>,
    modifier: Modifier = Modifier
) {
    var textState by remember { mutableStateOf("") }
    var replyingTo by remember { mutableStateOf<MessageEntity?>(null) }
    var fullScreenImageUrl by remember { mutableStateOf<String?>(null) }
    var fullScreenImageName by remember { mutableStateOf<String?>(null) }
    var fullScreenImageMimeType by remember { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(0)
        }
    }

    Column(modifier = modifier.fillMaxSize().background(ScrymeDarkSurfaceVariant)) {
        // Messages List
        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            state = listState,
            reverseLayout = true,
            contentPadding = PaddingValues(bottom = 8.dp)
        ) {
            items(messages, key = { it.id }) { message ->
                SwipeableMessageItem(
                    message = message,
                    onReply = {
                        replyingTo = it
                        onReply(it)
                    },
                    onForward = { onForward(it) },
                    onDownload = onDownload,
                    onImageClick = { attachment ->
                        fullScreenImageUrl = attachment.url
                        fullScreenImageName = attachment.name
                        fullScreenImageMimeType = attachment.type
                    }
                )
            }
        }

        // Typing Indicator
        AnimatedVisibility(
            visible = typingUsers.isNotEmpty(),
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            Text(
                text = if (typingUsers.size == 1) "${typingUsers[0]} is typing..." else "${typingUsers.size} users are typing...",
                color = ScrymeDarkTextSecondary,
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )
        }

        // Input Area
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(ScrymeDarkSurfaceVariant)
                .padding(8.dp)
        ) {
            replyingTo?.let { reply ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.Gray.copy(alpha = 0.2f))
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Reply, contentDescription = null, tint = ScrymeDarkTextSecondary, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Replying to ${reply.senderName ?: "User"}",
                        color = ScrymeDarkTextSecondary,
                        fontSize = 12.sp,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(onClick = { replyingTo = null }, modifier = Modifier.size(16.dp)) {
                        Icon(Icons.Default.Close, contentDescription = null, tint = ScrymeDarkTextSecondary)
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(ScrymeDarkBackground)
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { /* Add attachment */ }) {
                    Icon(Icons.Default.AddCircle, contentDescription = "Add", tint = ScrymeDarkTextSecondary)
                }

                TextField(
                    value = textState,
                    onValueChange = {
                        textState = it
                        if (it.isNotEmpty()) onTyping()
                    },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Message", color = ScrymeDarkTextSecondary) },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        disabledContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        focusedTextColor = ScrymeDarkTextPrimary,
                        unfocusedTextColor = ScrymeDarkTextPrimary
                    ),
                    maxLines = 4
                )

                if (textState.isNotBlank()) {
                    IconButton(onClick = {
                        onSendMessage(textState, replyingTo?.id)
                        textState = ""
                        replyingTo = null
                    }) {
                        Icon(Icons.Default.Send, contentDescription = "Send", tint = ScrymeDarkAccent)
                    }
                }
            }
        }
    }

    // Full screen image viewer
    if (fullScreenImageUrl != null) {
        Dialog(
            onDismissRequest = { fullScreenImageUrl = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            FullScreenImageViewer(
                url = fullScreenImageUrl!!,
                onClose = { fullScreenImageUrl = null },
                onDownload = {
                    fullScreenImageUrl?.let { url ->
                        onDownload(AttachmentDto(
                            id = "",
                            name = fullScreenImageName ?: "image.jpg",
                            url = url,
                            type = fullScreenImageMimeType ?: "image/jpeg",
                            size = 0
                        ))
                    }
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun SwipeableMessageItem(
    message: MessageEntity,
    onReply: (MessageEntity) -> Unit,
    onForward: (MessageEntity) -> Unit,
    onDownload: (AttachmentDto) -> Unit = {},
    onImageClick: (AttachmentDto) -> Unit = {}
) {
    // Basic implementation of swipe-to-action
    // In a real app, use a more sophisticated approach like AnchoredDraggable for better UX
    val swipeState = remember { mutableStateOf(0f) }
    val density = LocalDensity.current
    val threshold = with(density) { 80.dp.toPx() }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .draggable(
                state = rememberDraggableState { delta: Float ->
                    swipeState.value = (swipeState.value + delta).coerceIn(-threshold, threshold)
                },
                orientation = Orientation.Horizontal,
                onDragStopped = {
                    if (swipeState.value >= threshold * 0.7f) {
                        onReply(message)
                    } else if (swipeState.value <= -threshold * 0.7f) {
                        onForward(message)
                    }
                    swipeState.value = 0f
                }
            )
    ) {
        // Background Actions
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            horizontalArrangement = if (swipeState.value > 0) Arrangement.Start else Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (swipeState.value > 0) {
                Icon(Icons.Default.Reply, contentDescription = "Reply", tint = ScrymeDarkAccent)
            } else if (swipeState.value < 0) {
                Icon(Icons.Default.Forward, contentDescription = "Forward", tint = ScrymeDarkAccent)
            }
        }

        // Message Content
        var showContextMenu by remember { mutableStateOf(false) }

        Surface(
            modifier = Modifier
                .offset { IntOffset(swipeState.value.roundToInt(), 0) }
                .fillMaxWidth()
                .combinedClickable(
                    onClick = { },
                    onLongClick = { showContextMenu = true }
                ),
            color = Color.Transparent
        ) {
            MessageItem(
                message = message,
                onDownload = onDownload,
                onImageClick = onImageClick
            )

            DropdownMenu(
                expanded = showContextMenu,
                onDismissRequest = { showContextMenu = false },
                modifier = Modifier.background(ScrymeDarkSurface)
            ) {
                DropdownMenuItem(
                    text = { Text("Reply", color = ScrymeDarkTextPrimary) },
                    onClick = {
                        onReply(message)
                        showContextMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Reply, contentDescription = null, tint = ScrymeDarkTextSecondary) }
                )
                DropdownMenuItem(
                    text = { Text("Forward", color = ScrymeDarkTextPrimary) },
                    onClick = {
                        onForward(message)
                        showContextMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Forward, contentDescription = null, tint = ScrymeDarkTextSecondary) }
                )
                if (message.attachments.isNotEmpty()) {
                    message.attachments.forEach { attachment ->
                        DropdownMenuItem(
                            text = { Text("Download ${attachment.name}", color = ScrymeDarkTextPrimary) },
                            onClick = {
                                onDownload(attachment)
                                showContextMenu = false
                            },
                            leadingIcon = { Icon(Icons.Default.Download, contentDescription = null, tint = ScrymeDarkTextSecondary) }
                        )
                    }
                }
                DropdownMenuItem(
                    text = { Text("Copy Text", color = ScrymeDarkTextPrimary) },
                    onClick = {
                        // TODO: Implement copy to clipboard
                        showContextMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.ContentCopy, contentDescription = null, tint = ScrymeDarkTextSecondary) }
                )
            }
        }
    }
}

@Composable
fun MessageItem(
    message: MessageEntity,
    onDownload: (AttachmentDto) -> Unit = {},
    onImageClick: (AttachmentDto) -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
    ) {
        AsyncImage(
            model = message.senderAvatar ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}",
            contentDescription = null,
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(Color.Gray),
            contentScale = ContentScale.Crop
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = message.senderName ?: "Unknown User",
                    color = ScrymeDarkTextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = message.createdAt.split("T").getOrNull(0) ?: "",
                    color = ScrymeDarkTextSecondary,
                    fontSize = 12.sp
                )
            }

            if (message.replyToSenderName != null) {
                Text(
                    text = "Replying to ${message.replyToSenderName}",
                    color = ScrymeDarkAccent,
                    fontSize = 12.sp,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )
            }

            Spacer(modifier = Modifier.height(2.dp))

            // Render message content based on type
            when (message.messageType) {
                "poll" -> {
                    val question = message.metadata?.get("question") as? String ?: "Poll"
                    val optionsMap = message.metadata?.get("options") as? List<Map<String, Any>> ?: emptyList()
                    val options = optionsMap.map {
                        PollOption(it["id"] as String, it["text"] as String, (it["votes"] as? Number)?.toInt() ?: 0)
                    }
                    val totalVotes = options.sumOf { it.votes }
                    val selectedOptionId = message.metadata?.get("userVote") as? String
                    PollComponent(
                        question = question,
                        options = options,
                        totalVotes = totalVotes,
                        selectedOptionId = selectedOptionId,
                        onOptionClick = {}
                    )
                }
                "graph" -> {
                    val title = message.metadata?.get("title") as? String ?: "Graph"
                    val data = (message.metadata?.get("data") as? List<Number>)?.map { it.toFloat() } ?: emptyList()
                    val labels = message.metadata?.get("labels") as? List<String> ?: emptyList()
                    GraphComponent(title = title, data = data, labels = labels)
                }
                else -> {
                    MarkdownText(content = message.content)
                }
            }

            // Attachments
            val context = LocalContext.current
            message.attachments.forEach { attachment ->
                if (attachment.type.startsWith("image/")) {
                    Box(modifier = Modifier.padding(top = 8.dp)) {
                        AsyncImage(
                            model = attachment.url,
                            contentDescription = null,
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 300.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { onImageClick(attachment) },
                            contentScale = ContentScale.Fit
                        )
                        IconButton(
                            onClick = {
                                Toast.makeText(context, "Starting download...", Toast.LENGTH_SHORT).show()
                                onDownload(attachment)
                            },
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(4.dp)
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.5f))
                        ) {
                            Icon(
                                Icons.Default.Download,
                                contentDescription = "Download",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier
                            .padding(top = 8.dp)
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(ScrymeDarkSurface)
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.FilePresent, contentDescription = null, tint = ScrymeDarkTextSecondary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = attachment.name,
                            color = ScrymeDarkTextPrimary,
                            fontSize = 14.sp,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = {
                            Toast.makeText(context, "Starting download...", Toast.LENGTH_SHORT).show()
                            onDownload(attachment)
                        }) {
                            Icon(Icons.Default.Download, contentDescription = "Download", tint = ScrymeDarkTextSecondary)
                        }
                    }
                }
            }

            // Reactions
            if (message.reactions.isNotEmpty()) {
                Row(
                    modifier = Modifier.padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    message.reactions.forEach { reaction ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color.Gray.copy(alpha = 0.2f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(text = reaction.emoji, fontSize = 12.sp)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = reaction.count.toString(), color = ScrymeDarkTextSecondary, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
