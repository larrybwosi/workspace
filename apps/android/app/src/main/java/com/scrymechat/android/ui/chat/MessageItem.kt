package com.scrymechat.android.ui.chat

import android.content.Context
import android.content.ClipboardManager
import android.content.ClipData
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.MessageEntity
import com.scrymechat.android.data.local.entities.ForwardedSnapshot
import com.scrymechat.android.data.remote.AttachmentDto
import com.scrymechat.android.data.remote.MessageActionDto
import com.scrymechat.android.data.remote.MessageActionHandlerDto
import com.scrymechat.android.ui.components.*
import java.time.Duration
import java.time.Instant
import kotlin.math.roundToInt

private val ShapeBubble = RoundedCornerShape(14.dp)
private val ShapeChip = RoundedCornerShape(10.dp)

// Matches the main row's avatar gutter (14dp start padding + 38dp avatar + 12dp spacer)
// so the reply row, avatar row, and content column all line up like Discord's does.
private val GutterStart = 14.dp
private val AvatarSize = 38.dp
private val GutterSpacer = 12.dp
private val ReplyAvatarSize = 16.dp
private val ForwardAvatarSize = 22.dp

@Composable
fun BotBadge() {
    Surface(
        shape = RoundedCornerShape(3.dp),
        color = Color(0xFF5865F2) // Discord Blurple
    ) {
        Text(
            text = "BOT",
            color = Color.White,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.5.dp),
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun SystemBadge() {
    Surface(
        shape = RoundedCornerShape(3.dp),
        color = Color(0xFF5865F2) // Discord Blurple
    ) {
        Text(
            text = "SYSTEM",
            color = Color.White,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.5.dp),
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun AdminBadge() {
    Surface(
        shape = RoundedCornerShape(3.dp),
        color = Color(0xFFF23F43) // Discord Red
    ) {
        Text(
            text = "ADMIN",
            color = Color.White,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.5.dp),
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun ModBadge() {
    Surface(
        shape = RoundedCornerShape(3.dp),
        color = Color(0xFF23A55A) // Discord Green
    ) {
        Text(
            text = "MOD",
            color = Color.White,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.5.dp),
            letterSpacing = 0.5.sp
        )
    }
}

/**
 * The little hook that connects the reply preview to the message below it, exactly
 * like Discord: a vertical stem centered under where the avatar above sits, curving
 * right into a horizontal run that lands on the reply avatar.
 */
@Composable
private fun ReplyConnector(color: Color, modifier: Modifier = Modifier) {
    androidx.compose.foundation.Canvas(modifier = modifier) {
        val stemX = size.width * 0.5f
        val cornerRadius = 8.dp.toPx()
        val strokeWidth = 2.dp.toPx()
        val bottomY = size.height - strokeWidth / 2

        val path = androidx.compose.ui.graphics.Path().apply {
            moveTo(stemX, 0f)
            lineTo(stemX, bottomY - cornerRadius)
            quadraticBezierTo(
                stemX, bottomY,
                stemX + cornerRadius, bottomY
            )
            lineTo(size.width, bottomY)
        }
        drawPath(
            path = path,
            color = color,
            style = androidx.compose.ui.graphics.drawscope.Stroke(
                width = strokeWidth,
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
        )
    }
}

/**
 * Discord-style "Forwarded" label — a small forward icon + italic caption sitting
 * directly above the quoted snapshot card(s), never above the avatar/name row.
 */
@Composable
private fun ForwardedHeader(palette: ChatPalette) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            Icons.Default.Forward,
            contentDescription = null,
            tint = palette.textTertiary,
            modifier = Modifier.size(13.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = "Forwarded",
            color = palette.textTertiary,
            fontSize = 12.5.sp,
            fontStyle = FontStyle.Italic,
            fontWeight = FontWeight.Medium
        )
    }
}

/**
 * A single quoted "snapshot" card inside a forwarded message — mini avatar, sender
 * name, timestamp, the original text (if any), and any attachments, all rendered at
 * a smaller scale than a normal message so it reads as an embedded quote.
 */
@Composable
private fun ForwardedSnapshotCard(
    snapshot: ForwardedSnapshot,
    palette: ChatPalette,
    onImageClick: (AttachmentDto) -> Unit,
    onDownload: (AttachmentDto) -> Unit
) {
    val context = LocalContext.current
    val senderName = snapshot.senderName ?: "Unknown User"

    Row(modifier = Modifier.fillMaxWidth()) {
        UserAvatar(
            name = senderName,
            avatarUrl = snapshot.senderAvatar,
            size = ForwardAvatarSize,
            borderColor = Color.Transparent
        )

        Spacer(modifier = Modifier.width(8.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = senderName,
                    color = palette.textPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.5.sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = formatMessageTimestamp(snapshot.createdAt),
                    color = palette.textTertiary,
                    fontSize = 10.5.sp
                )
            }

            if (snapshot.content.isNotBlank()) {
                Spacer(modifier = Modifier.height(2.dp))
                MarkdownText(
                    content = snapshot.content,
                    onMentionClick = {},
                    onChannelTagClick = {}
                )
            } else if (snapshot.attachments.isEmpty()) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Original message was deleted or unavailable",
                    color = palette.textTertiary,
                    fontSize = 13.sp,
                    fontStyle = FontStyle.Italic
                )
            }

            snapshot.attachments.forEach { attachment ->
                if (attachment.type.startsWith("image/")) {
                    Box(modifier = Modifier.padding(top = 6.dp)) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, palette.bubbleBorder)
                        ) {
                            AsyncImage(
                                model = attachment.url,
                                contentDescription = null,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(max = 180.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable { onImageClick(attachment) },
                                contentScale = ContentScale.Fit
                            )
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier
                            .padding(top = 6.dp)
                            .fillMaxWidth()
                            .clip(ShapeChip)
                            .background(palette.attachmentChipBg)
                            .border(1.dp, palette.bubbleBorder, ShapeChip)
                            .padding(horizontal = 8.dp, vertical = 6.dp)
                            .clickable {
                                Toast.makeText(context, "Starting download...", Toast.LENGTH_SHORT).show()
                                onDownload(attachment)
                            },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.FilePresent,
                            contentDescription = null,
                            tint = palette.accent,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = attachment.name,
                            color = palette.textPrimary,
                            fontSize = 12.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false)
                        )
                    }
                }
            }
        }
    }
}

/**
 * The bordered container holding one or more ForwardedSnapshotCards, stacked with a
 * divider between them when several messages were forwarded together.
 */
@Composable
private fun ForwardedMessageBlock(
    snapshots: List<ForwardedSnapshot>,
    palette: ChatPalette,
    onImageClick: (AttachmentDto) -> Unit,
    onDownload: (AttachmentDto) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        ForwardedHeader(palette = palette)
        Spacer(modifier = Modifier.height(4.dp))
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(palette.bubbleSurface)
                .border(1.dp, palette.bubbleBorder, RoundedCornerShape(8.dp))
                .padding(10.dp)
        ) {
            snapshots.forEachIndexed { index, snapshot ->
                ForwardedSnapshotCard(
                    snapshot = snapshot,
                    palette = palette,
                    onImageClick = onImageClick,
                    onDownload = onDownload
                )
                if (index != snapshots.lastIndex) {
                    Divider(
                        color = palette.bubbleBorder,
                        thickness = 1.dp,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun SwipeableMessageItem(
    message: MessageEntity,
    isGroupHeader: Boolean = true,
    palette: ChatPalette,
    repliedMessage: MessageEntity? = null,
    onReplyClick: (String) -> Unit = {},
    onReply: (MessageEntity) -> Unit,
    onOpenThread: (MessageEntity) -> Unit = {},
    onAddReaction: (MessageEntity) -> Unit = {},
    onForward: (MessageEntity) -> Unit,
    onDownload: (AttachmentDto) -> Unit = {},
    onAction: (MessageActionDto, Map<String, Any>) -> Unit = { _, _ -> },
    onUpdateForm: (String, Any) -> Unit = { _, _ -> },
    formState: Map<String, Any> = emptyMap(),
    isLoading: Boolean = false,
    onImageClick: (AttachmentDto) -> Unit = {},
    onAvatarClick: (String) -> Unit = {},
    apiUrl: String = "http://localhost:3000",
    onMentionClick: (String) -> Unit = {},
    onChannelTagClick: (String) -> Unit = {},
    onEditMessage: (MessageEntity, String) -> Unit = { _, _ -> },
    onDeleteMessage: (MessageEntity) -> Unit = {},
    currentUserId: String? = null,
    highlightedMessageId: String? = null
) {
    val swipeState = remember { mutableStateOf(0f) }
    val density = LocalDensity.current
    val threshold = with(density) { 80.dp.toPx() }
    val animatedOffset by animateFloatAsState(
        targetValue = swipeState.value,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "swipeOffset"
    )
    val swipeProgress = (kotlin.math.abs(swipeState.value) / threshold).coerceIn(0f, 1f)

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
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            horizontalArrangement = if (animatedOffset > 0) Arrangement.Start else Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (animatedOffset > 4f) {
                SwipeActionIcon(icon = Icons.Default.Reply, palette = palette, progress = swipeProgress)
            } else if (animatedOffset < -4f) {
                SwipeActionIcon(icon = Icons.Default.Forward, palette = palette, progress = swipeProgress)
            }
        }

        var showContextMenu by remember { mutableStateOf(false) }
        var showEditDialog by remember { mutableStateOf(false) }
        var showDeleteDialog by remember { mutableStateOf(false) }
        val context = LocalContext.current

        val isHighlighted = highlightedMessageId == message.id
        val highlightBgColor by animateColorAsState(
            targetValue = if (isHighlighted) palette.accent.copy(alpha = 0.25f) else Color.Transparent,
            animationSpec = tween(durationMillis = 300),
            label = "highlightBg"
        )

        Surface(
            modifier = Modifier
                .offset { IntOffset(animatedOffset.roundToInt(), 0) }
                .fillMaxWidth()
                .combinedClickable(
                    onClick = { },
                    onLongClick = { showContextMenu = true }
                ),
            color = highlightBgColor
        ) {
            Box {
                MessageItem(
                    message = message,
                    isGroupHeader = isGroupHeader,
                    palette = palette,
                    repliedMessage = repliedMessage,
                    onReplyClick = onReplyClick,
                    onDownload = onDownload,
                    onAction = onAction,
                    onUpdateForm = onUpdateForm,
                    formState = formState,
                    isLoading = isLoading,
                    onImageClick = onImageClick,
                    onOpenThread = { onOpenThread(message) },
                    onAvatarClick = onAvatarClick,
                    apiUrl = apiUrl,
                    onMentionClick = onMentionClick,
                    onChannelTagClick = onChannelTagClick
                )

                if (showContextMenu) {
                    MessageContextBottomSheet(
                        message = message,
                        currentUserId = currentUserId,
                        onDismiss = { showContextMenu = false },
                        onReply = {
                            onReply(message)
                            showContextMenu = false
                        },
                        onForward = {
                            onForward(message)
                            showContextMenu = false
                        },
                        onAddReaction = { emoji ->
                            onAddReaction(message)
                            onAction(MessageActionDto(id = "add_reaction", label = "Reaction", handler = MessageActionHandlerDto("CALLBACK")), mapOf("emoji" to emoji))
                            showContextMenu = false
                        },
                        onCopyText = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Message content", message.content)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()
                            showContextMenu = false
                        },
                        onEdit = {
                            showEditDialog = true
                            showContextMenu = false
                        },
                        onDelete = {
                            showDeleteDialog = true
                            showContextMenu = false
                        },
                        onDownload = onDownload
                    )
                }

                if (showEditDialog) {
                    EditMessageDialog(
                        initialText = message.content,
                        onDismiss = { showEditDialog = false },
                        onConfirm = { newContent ->
                            onEditMessage(message, newContent)
                            showEditDialog = false
                        }
                    )
                }

                if (showDeleteDialog) {
                    DeleteMessageConfirmationDialog(
                        onDismiss = { showDeleteDialog = false },
                        onConfirm = {
                            onDeleteMessage(message)
                            showDeleteDialog = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun SwipeActionIcon(icon: ImageVector, palette: ChatPalette, progress: Float) {
    Box(
        modifier = Modifier
            .size(34.dp)
            .alpha(0.4f + 0.6f * progress)
            .clip(CircleShape)
            .background(palette.accentSoft),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = palette.accent,
            modifier = Modifier.size(16.dp)
        )
    }
}

@Composable
fun MessageItem(
    message: MessageEntity,
    isGroupHeader: Boolean = true,
    palette: ChatPalette,
    repliedMessage: MessageEntity? = null,
    onReplyClick: (String) -> Unit = {},
    onDownload: (AttachmentDto) -> Unit = {},
    onOpenThread: () -> Unit = {},
    onAction: (MessageActionDto, Map<String, Any>) -> Unit = { _, _ -> },
    onUpdateForm: (String, Any) -> Unit = { _, _ -> },
    formState: Map<String, Any> = emptyMap(),
    isLoading: Boolean = false,
    onImageClick: (AttachmentDto) -> Unit = {},
    onAvatarClick: (String) -> Unit = {},
    apiUrl: String = "http://localhost:3000",
    onMentionClick: (String) -> Unit = {},
    onChannelTagClick: (String) -> Unit = {}
) {
    val cleanName = remember(message.senderName) {
        val rawName = message.senderName ?: "Unknown User"
        if (rawName.contains("@")) {
            rawName.substringBefore("@")
        } else {
            rawName
        }
    }

    val isReply = message.replyToId != null
    val isForwarded = message.forwardedMessages.isNotEmpty()
    // Discord always breaks a run and shows the full header (avatar + name) on a
    // message that's a reply or a forward, even if it directly follows the same author.
    val showHeader = isGroupHeader || isReply || isForwarded

    Column(modifier = Modifier.fillMaxWidth()) {
        if (isReply) {
            val repliedName = message.replyToSenderName ?: repliedMessage?.senderName ?: "Unknown User"
            val hasContent = !repliedMessage?.content.isNullOrBlank()
            val hasAttachmentOnly = !hasContent && repliedMessage?.attachments?.isNotEmpty() == true
            val previewText = when {
                hasContent -> repliedMessage!!.content
                hasAttachmentOnly -> {
                    val attachment = repliedMessage!!.attachments.first()
                    if (attachment.type.startsWith("image/")) "\uD83D\uDCF7 Photo" else "\uD83D\uDCCE ${attachment.name}"
                }
                else -> "Original message was deleted or unavailable"
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = GutterStart, top = 6.dp)
                    .clickable { onReplyClick(message.replyToId!!) },
                verticalAlignment = Alignment.Bottom
            ) {
                ReplyConnector(
                    color = palette.replyStripAccent.copy(alpha = 0.45f),
                    modifier = Modifier
                        .width(AvatarSize)
                        .height(15.dp)
                )

                Spacer(modifier = Modifier.width(GutterSpacer - ReplyAvatarSize / 2))

                UserAvatar(
                    name = repliedName,
                    avatarUrl = repliedMessage?.senderAvatar,
                    size = ReplyAvatarSize,
                    borderColor = Color.Transparent
                )

                Spacer(modifier = Modifier.width(4.dp))

                Text(
                    text = "@$repliedName",
                    color = palette.replyStripAccent,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1
                )

                Spacer(modifier = Modifier.width(5.dp))

                Text(
                    text = previewText,
                    color = if (hasContent) palette.textSecondary else palette.textTertiary,
                    fontSize = 13.sp,
                    fontStyle = if (hasContent) FontStyle.Normal else FontStyle.Italic,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    start = GutterStart,
                    end = GutterStart,
                    top = if (showHeader) (if (isReply) 1.dp else 6.dp) else 1.dp,
                    bottom = if (showHeader) 6.dp else 1.dp
                )
        ) {
            if (showHeader) {
                UserAvatar(
                    name = cleanName,
                    avatarUrl = message.senderAvatar,
                    size = AvatarSize,
                    modifier = Modifier.clickable { onAvatarClick(message.senderId) },
                    borderColor = palette.glassBorder
                )
            } else {
                Box(
                    modifier = Modifier.size(AvatarSize),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = formatMessageTimestamp(message.createdAt, shortOnly = true),
                        color = palette.textTertiary.copy(alpha = 0.5f),
                        fontSize = 9.5.sp
                    )
                }
            }

            Spacer(modifier = Modifier.width(GutterSpacer))

            Column(modifier = Modifier.weight(1f)) {
                if (showHeader) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = cleanName,
                            color = palette.textPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 16.sp,
                            modifier = Modifier.clickable { onAvatarClick(message.senderId) }
                        )

                        val senderId = message.senderId
                        val senderRole = message.senderRole
                        val rawName = message.senderName ?: ""

                        val isSystem = senderId == "system" ||
                                       senderRole?.equals("system", ignoreCase = true) == true ||
                                       rawName.equals("system", ignoreCase = true)

                        val isBot = !isSystem && (
                                       senderId.startsWith("m2m:") ||
                                       senderRole?.equals("bot", ignoreCase = true) == true ||
                                       rawName.contains("bot", ignoreCase = true)
                                    )

                        val isAdmin = !isSystem && !isBot && (
                                       senderRole?.equals("admin", ignoreCase = true) == true ||
                                       senderRole?.equals("owner", ignoreCase = true) == true
                                    )

                        val isMod = !isSystem && !isBot && !isAdmin && (
                                       senderRole?.equals("moderator", ignoreCase = true) == true ||
                                       senderRole?.equals("staff", ignoreCase = true) == true
                                    )

                        if (isSystem) {
                            Spacer(modifier = Modifier.width(6.dp))
                            SystemBadge()
                        } else if (isBot) {
                            Spacer(modifier = Modifier.width(6.dp))
                            BotBadge()
                        } else if (isAdmin) {
                            Spacer(modifier = Modifier.width(6.dp))
                            AdminBadge()
                        } else if (isMod) {
                            Spacer(modifier = Modifier.width(6.dp))
                            ModBadge()
                        }

                        Spacer(modifier = Modifier.width(7.dp))
                        Text(
                            text = formatMessageTimestamp(message.createdAt),
                            color = palette.textTertiary,
                            fontSize = 11.5.sp
                        )
                        if (message.isPinned) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                Icons.Default.PushPin,
                                contentDescription = "Pinned",
                                tint = palette.accent,
                                modifier = Modifier.size(12.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                }

                val isRichContent = message.messageType in setOf("custom", "approval", "report", "poll", "graph")

                if (isRichContent) {
                    Surface(
                        shape = ShapeBubble,
                        color = palette.bubbleSurface,
                        border = BorderStroke(1.dp, palette.bubbleBorder)
                    ) {
                        Box(modifier = Modifier.padding(2.dp)) {
                            if (message.messageType == "custom" || message.messageType == "approval" || message.messageType == "report") {
                                val customMessage = message.customMessage
                                if (customMessage != null) {
                                    CustomMessageRenderer(
                                        customMessage = customMessage,
                                        formState = formState,
                                        onUpdateForm = onUpdateForm,
                                        onActionTriggered = { action -> onAction(action, formState) },
                                        isLoading = isLoading
                                    )
                                } else {
                                    MarkdownText(
                                        content = message.content.ifEmpty { " " },
                                        onMentionClick = onMentionClick,
                                        onChannelTagClick = onChannelTagClick
                                    )
                                }
                            } else {
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
                                        MarkdownText(
                                            content = message.content.ifEmpty { " " },
                                            onMentionClick = onMentionClick,
                                            onChannelTagClick = onChannelTagClick
                                        )
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (message.content.isNotBlank()) {
                        MarkdownText(
                            content = message.content,
                            onMentionClick = onMentionClick,
                            onChannelTagClick = onChannelTagClick
                        )
                    }
                }

                // Forwarded message(s) — rendered as quoted snapshot card(s) below any
                // comment the sender added, exactly like Discord's forward embed.
                if (isForwarded) {
                    ForwardedMessageBlock(
                        snapshots = message.forwardedMessages,
                        palette = palette,
                        onImageClick = onImageClick,
                        onDownload = onDownload,
                        modifier = Modifier.padding(top = if (message.content.isNotBlank()) 8.dp else 0.dp)
                    )
                }

                val context = LocalContext.current
                message.attachments.forEach { attachment ->
                    if (attachment.type.startsWith("image/")) {
                        Box(modifier = Modifier.padding(top = 8.dp)) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, palette.bubbleBorder)
                            ) {
                                AsyncImage(
                                    model = attachment.url,
                                    contentDescription = null,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .heightIn(max = 300.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .clickable { onImageClick(attachment) },
                                    contentScale = ContentScale.Fit
                                )
                            }
                            IconButton(
                                onClick = {
                                    Toast.makeText(context, "Starting download...", Toast.LENGTH_SHORT).show()
                                    onDownload(attachment)
                                },
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(6.dp)
                                    .size(30.dp)
                                    .clip(CircleShape)
                                    .background(palette.scrimOverImage)
                            ) {
                                Icon(
                                    Icons.Default.Download,
                                    contentDescription = "Download",
                                    tint = Color.White,
                                    modifier = Modifier.size(15.dp)
                                )
                            }
                        }
                    } else {
                        val extension = attachment.name.substringAfterLast(".", "").lowercase()
                        val iconName = when (extension) {
                            "pdf" -> "pdf.svg"
                            "psd" -> "psd.svg"
                            "doc", "docx" -> "word.svg"
                            "xls", "xlsx" -> "xls.svg"
                            "xd" -> "xd.svg"
                            else -> null
                        }
                        val iconUrl = if (iconName != null) "$apiUrl/$iconName" else null

                        Row(
                            modifier = Modifier
                                .padding(top = 8.dp)
                                .fillMaxWidth()
                                .clip(ShapeChip)
                                .background(palette.attachmentChipBg)
                                .border(1.dp, palette.bubbleBorder, ShapeChip)
                                .padding(horizontal = 10.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(RoundedCornerShape(7.dp))
                                    .background(palette.accentSoft),
                                contentAlignment = Alignment.Center
                            ) {
                                if (iconUrl != null) {
                                    AsyncImage(
                                        model = iconUrl,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                } else {
                                    Icon(Icons.Default.FilePresent, contentDescription = null, tint = palette.accent, modifier = Modifier.size(15.dp))
                                }
                            }
                            Spacer(modifier = Modifier.width(9.dp))
                            Text(
                                text = attachment.name,
                                color = palette.textPrimary,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(
                                onClick = {
                                    Toast.makeText(context, "Starting download...", Toast.LENGTH_SHORT).show()
                                    onDownload(attachment)
                                },
                                modifier = Modifier.size(30.dp)
                            ) {
                                Icon(Icons.Default.Download, contentDescription = "Download", tint = palette.textSecondary, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }

                if (message.replyCount > 0 || message.threadId != null) {
                    TextButton(
                        onClick = onOpenThread,
                        contentPadding = PaddingValues(0.dp),
                        modifier = Modifier.heightIn(min = 32.dp)
                    ) {
                        Text(
                            text = if (message.replyCount > 0) "${message.replyCount} ${if (message.replyCount == 1) "reply" else "replies"}" else "View thread",
                            color = palette.accent,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                if (message.reactions.isNotEmpty()) {
                    Row(
                        modifier = Modifier.padding(top = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        message.reactions.forEach { reaction ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(50))
                                    .background(palette.reactionChipBg)
                                    .border(1.dp, palette.reactionChipBorder, RoundedCornerShape(50))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(text = reaction.emoji, fontSize = 12.sp)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(text = reaction.count.toString(), color = palette.textSecondary, fontSize = 11.5.sp, fontWeight = FontWeight.Medium)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun formatMessageTimestamp(createdAt: String, shortOnly: Boolean = false): String {
    return try {
        val timePart = createdAt.split("T").getOrNull(1) ?: return createdAt.split("T").getOrNull(0) ?: ""
        val hhmm = timePart.substringBefore(".").substringBefore("Z")
        val parts = hhmm.split(":")
        if (parts.size < 2) return createdAt.split("T").getOrNull(0) ?: ""
        var hour = parts[0].toIntOrNull() ?: return hhmm
        val minute = parts[1]
        if (shortOnly) {
            return String.format("%02d:%s", hour, minute)
        }
        val suffix = if (hour >= 12) "PM" else "AM"
        if (hour == 0) hour = 12 else if (hour > 12) hour -= 12
        "$hour:$minute $suffix"
    } catch (e: Exception) {
        createdAt.split("T").getOrNull(0) ?: createdAt
    }
}

fun isWithinGroupingTimeframe(time1: String, time2: String): Boolean {
    return try {
        val instant1 = Instant.parse(time1)
        val instant2 = Instant.parse(time2)
        Duration.between(instant1, instant2).abs().toMinutes() < 5
    } catch (e: Exception) {
        false
    }
}
