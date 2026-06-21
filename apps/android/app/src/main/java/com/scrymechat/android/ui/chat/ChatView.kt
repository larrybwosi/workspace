package com.scrymechat.android.ui.chat

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.isSystemInDarkTheme
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.MessageEntity
import com.scrymechat.android.data.remote.AttachmentDto
import com.scrymechat.android.data.remote.MessageActionDto
import com.scrymechat.android.ui.components.*
import kotlin.math.roundToInt

// ─── Theme-aware palette ─────────────────────────────────────────────────────
// Mirrors the premium direction used on the login screen: rich gradients,
// glass surfaces, and distinct light/dark variants rather than a single
// shared dark-only palette (the original hardcoded ScrymeDark* tokens).

data class ChatPalette(
    val isDark: Boolean,
    val canvasBg: Color,
    val surface: Color,
    val surfaceVariant: Color,
    val glassSurface: Color,
    val glassBorder: Color,
    val bubbleSurface: Color,
    val bubbleBorder: Color,
    val inputBarBg: Color,
    val inputFieldBg: Color,
    val inputFieldBorder: Color,
    val inputFieldBorderFocused: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textTertiary: Color,
    val accent: Color,
    val accentGradient: List<Color>,
    val accentSoft: Color,
    val divider: Color,
    val replyStripBg: Color,
    val replyStripAccent: Color,
    val attachmentChipBg: Color,
    val reactionChipBg: Color,
    val reactionChipBorder: Color,
    val scrimOverImage: Color,
)

@Composable
fun chatPalette(isDark: Boolean = isSystemInDarkTheme()): ChatPalette {
    return if (isDark) {
        ChatPalette(
            isDark = true,
            canvasBg = Color(0xFF0A0B10),
            surface = Color(0xFF15171F),
            surfaceVariant = Color(0xFF0E0F16),
            glassSurface = Color.White.copy(alpha = 0.05f),
            glassBorder = Color.White.copy(alpha = 0.09f),
            bubbleSurface = Color.White.copy(alpha = 0.035f),
            bubbleBorder = Color.White.copy(alpha = 0.06f),
            inputBarBg = Color(0xFF11131B),
            inputFieldBg = Color.White.copy(alpha = 0.05f),
            inputFieldBorder = Color.White.copy(alpha = 0.10f),
            inputFieldBorderFocused = Color(0xFF818CF8),
            textPrimary = Color(0xFFF4F5F8),
            textSecondary = Color(0xFF9CA3B5),
            textTertiary = Color(0xFF6B7280),
            accent = Color(0xFF818CF8),
            accentGradient = listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)),
            accentSoft = Color(0xFF818CF8).copy(alpha = 0.16f),
            divider = Color.White.copy(alpha = 0.06f),
            replyStripBg = Color(0xFF818CF8).copy(alpha = 0.10f),
            replyStripAccent = Color(0xFF818CF8),
            attachmentChipBg = Color.White.copy(alpha = 0.04f),
            reactionChipBg = Color.White.copy(alpha = 0.06f),
            reactionChipBorder = Color.White.copy(alpha = 0.10f),
            scrimOverImage = Color.Black.copy(alpha = 0.55f),
        )
    } else {
        ChatPalette(
            isDark = false,
            canvasBg = Color(0xFFF6F7FB),
            surface = Color.White,
            surfaceVariant = Color(0xFFFAFAFD),
            glassSurface = Color.White.copy(alpha = 0.7f),
            glassBorder = Color(0xFFE7E9F3),
            bubbleSurface = Color.White,
            bubbleBorder = Color(0xFFEDEEF6),
            inputBarBg = Color(0xFFFAFAFD),
            inputFieldBg = Color.White,
            inputFieldBorder = Color(0xFFE2E5F1),
            inputFieldBorderFocused = Color(0xFF6366F1),
            textPrimary = Color(0xFF11121A),
            textSecondary = Color(0xFF676B80),
            textTertiary = Color(0xFF9598A8),
            accent = Color(0xFF5B54E0),
            accentGradient = listOf(Color(0xFF4F46E5), Color(0xFF7C3AED)),
            accentSoft = Color(0xFF5B54E0).copy(alpha = 0.10f),
            divider = Color(0xFFEEEFF6),
            replyStripBg = Color(0xFF5B54E0).copy(alpha = 0.07f),
            replyStripAccent = Color(0xFF5B54E0),
            attachmentChipBg = Color(0xFFF6F7FB),
            reactionChipBg = Color(0xFFF1F1FA),
            reactionChipBorder = Color(0xFFE2E5F1),
            scrimOverImage = Color.Black.copy(alpha = 0.45f),
        )
    }
}

private val ShapeBubble = RoundedCornerShape(14.dp)
private val ShapeChip = RoundedCornerShape(10.dp)
private val ShapeInputBar = RoundedCornerShape(22.dp)

// ──────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ChatView(
    messages: List<MessageEntity>,
    onSendMessage: (String, String?) -> Unit,
    onReply: (MessageEntity) -> Unit,
    onOpenThread: (MessageEntity) -> Unit = {},
    onForward: (MessageEntity) -> Unit,
    onBack: () -> Unit = {},
    isThread: Boolean = false,
    threadTitle: String? = null,
    onDownload: (AttachmentDto) -> Unit = {},
    onAction: (MessageEntity, MessageActionDto, Map<String, Any>) -> Unit = { _, _, _ -> },
    onUpdateForm: (String, String, Any) -> Unit = { _, _, _ -> },
    formStates: Map<String, Map<String, Any>> = emptyMap(),
    loadingActions: Set<String> = emptySet(),
    onTyping: () -> Unit = {},
    typingUsers: List<String>,
    modifier: Modifier = Modifier
) {
    val palette = chatPalette()
    var textState by remember { mutableStateOf("") }
    var replyingTo by remember { mutableStateOf<MessageEntity?>(null) }
    var fullScreenImageUrl by remember { mutableStateOf<String?>(null) }
    var fullScreenImageName by remember { mutableStateOf<String?>(null) }
    var fullScreenImageMimeType by remember { mutableStateOf<String?>(null) }
    var inputFocused by remember { mutableStateOf(false) }
    var reactionPickerMessage by remember { mutableStateOf<MessageEntity?>(null) }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(0)
        }
    }

    Column(modifier = modifier.fillMaxSize().background(palette.canvasBg)) {
        if (isThread) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
                }
                Text(
                    text = threadTitle ?: "Thread",
                    color = palette.textPrimary,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }
            Divider(color = palette.divider)
        }

        // Messages List
        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            state = listState,
            reverseLayout = true,
            contentPadding = PaddingValues(top = 12.dp, bottom = 8.dp)
        ) {
            items(messages, key = { it.id }) { message ->
                SwipeableMessageItem(
                    message = message,
                    palette = palette,
                    onReply = {
                        replyingTo = it
                        onReply(it)
                    },
                    onOpenThread = onOpenThread,
                    onForward = { onForward(it) },
                    onDownload = onDownload,
                    onAction = { action, formState -> onAction(message, action, formState) },
                    onUpdateForm = { fieldId, value -> onUpdateForm(message.id, fieldId, value) },
                    formState = formStates[message.id] ?: emptyMap(),
                    isLoading = loadingActions.contains(message.id),
                    onImageClick = { attachment ->
                        fullScreenImageUrl = attachment.url
                        fullScreenImageName = attachment.name
                        fullScreenImageMimeType = attachment.type
                    },
                    onAddReaction = { reactionPickerMessage = it }
                )
            }
        }

        // Typing Indicator
        AnimatedVisibility(
            visible = typingUsers.isNotEmpty(),
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            Row(
                modifier = Modifier
                    .padding(horizontal = 16.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(50))
                    .background(palette.glassSurface)
                    .border(1.dp, palette.glassBorder, RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TypingDots(color = palette.accent)
                Text(
                    text = if (typingUsers.size == 1) "${typingUsers[0]} is typing" else "${typingUsers.size} people are typing",
                    color = palette.textSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        // Input Area
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(palette.inputBarBg)
                .padding(horizontal = 10.dp, vertical = 8.dp)
        ) {
            AnimatedVisibility(
                visible = replyingTo != null,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                replyingTo?.let { reply ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(palette.replyStripBg)
                            .padding(start = 10.dp, end = 6.dp, top = 8.dp, bottom = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .width(3.dp)
                                .height(24.dp)
                                .background(palette.replyStripAccent, RoundedCornerShape(2.dp))
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Icon(
                            Icons.Default.Reply,
                            contentDescription = null,
                            tint = palette.replyStripAccent,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Replying to ${reply.senderName ?: "User"}",
                            color = palette.textPrimary,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = { replyingTo = null }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Close, contentDescription = "Cancel reply", tint = palette.textTertiary, modifier = Modifier.size(15.dp))
                        }
                    }
                }
            }

            val inputBorderColor by animateColorAsState(
                targetValue = if (inputFocused) palette.inputFieldBorderFocused else palette.inputFieldBorder,
                label = "inputBorder"
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(ShapeInputBar)
                    .background(palette.inputFieldBg)
                    .border(1.5.dp, inputBorderColor, ShapeInputBar)
                    .padding(horizontal = 6.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { /* Add attachment */ }, modifier = Modifier.size(38.dp)) {
                    Icon(Icons.Default.AddCircle, contentDescription = "Add attachment", tint = palette.textSecondary, modifier = Modifier.size(22.dp))
                }

                TextField(
                    value = textState,
                    onValueChange = {
                        textState = it
                        if (it.isNotEmpty()) onTyping()
                    },
                    modifier = Modifier
                        .weight(1f)
                        .onFocusChanged { inputFocused = it.isFocused },
                    placeholder = { Text("Message", color = palette.textTertiary, fontSize = 14.sp) },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        disabledContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        focusedTextColor = palette.textPrimary,
                        unfocusedTextColor = palette.textPrimary,
                        cursorColor = palette.accent
                    ),
                    textStyle = LocalTextStyle.current.copy(fontSize = 14.5.sp),
                    maxLines = 5
                )

                AnimatedVisibility(
                    visible = textState.isNotBlank(),
                    enter = scaleIn() + fadeIn(),
                    exit = scaleOut() + fadeOut()
                ) {
                    Box(
                        modifier = Modifier
                            .padding(3.dp)
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(palette.accentGradient))
                            .clickable {
                                onSendMessage(textState, replyingTo?.id)
                                textState = ""
                                replyingTo = null
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Send,
                            contentDescription = "Send",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }

    // Reaction Picker
    if (reactionPickerMessage != null) {
        ReactionPicker(
            onEmojiSelected = { emoji ->
                reactionPickerMessage?.let { msg ->
                    onAction(msg, MessageActionDto(id = "add_reaction", label = "Reaction", handler = com.scrymechat.android.data.remote.MessageActionHandlerDto("CALLBACK")), mapOf("emoji" to emoji))
                }
            },
            onDismiss = { reactionPickerMessage = null }
        )
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

@Composable
private fun TypingDots(color: Color) {
    val infinite = rememberInfiniteTransition(label = "typing")
    Row(horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.CenterVertically) {
        repeat(3) { index ->
            val delay = index * 150
            val scale by infinite.animateFloat(
                initialValue = 0.4f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(600, delayMillis = delay, easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "dot$index"
            )
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .alpha(0.4f + 0.6f * scale)
                    .background(color, CircleShape)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun SwipeableMessageItem(
    message: MessageEntity,
    palette: ChatPalette,
    onReply: (MessageEntity) -> Unit,
    onOpenThread: (MessageEntity) -> Unit = {},
    onAddReaction: (MessageEntity) -> Unit = {},
    onForward: (MessageEntity) -> Unit,
    onDownload: (AttachmentDto) -> Unit = {},
    onAction: (MessageActionDto, Map<String, Any>) -> Unit = { _, _ -> },
    onUpdateForm: (String, Any) -> Unit = { _, _ -> },
    formState: Map<String, Any> = emptyMap(),
    isLoading: Boolean = false,
    onImageClick: (AttachmentDto) -> Unit = {}
) {
    // Swipe-to-action. Kept lightweight (drag offset + threshold) per the
    // original approach, but with spring-back animation and a clearer,
    // theme-aware reveal so the affordance reads as intentional rather than
    // a layout glitch mid-drag.
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
        // Background Actions — scale + fade in as the swipe approaches threshold
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
            horizontalArrangement = if (animatedOffset > 0) Arrangement.Start else Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (animatedOffset > 4f) {
                SwipeActionIcon(icon = Icons.Default.Reply, palette = palette, progress = swipeProgress)
            } else if (animatedOffset < -4f) {
                SwipeActionIcon(icon = Icons.Default.Forward, palette = palette, progress = swipeProgress)
            }
        }

        // Message Content
        var showContextMenu by remember { mutableStateOf(false) }

        Surface(
            modifier = Modifier
                .offset { IntOffset(animatedOffset.roundToInt(), 0) }
                .fillMaxWidth()
                .combinedClickable(
                    onClick = { },
                    onLongClick = { showContextMenu = true }
                ),
            color = Color.Transparent
        ) {
            Box {
                MessageItem(
                    message = message,
                    palette = palette,
                    onDownload = onDownload,
                    onAction = onAction,
                    onUpdateForm = onUpdateForm,
                    formState = formState,
                    isLoading = isLoading,
                    onImageClick = onImageClick,
                    onOpenThread = { onOpenThread(message) }
                )

                DropdownMenu(
                    expanded = showContextMenu,
                    onDismissRequest = { showContextMenu = false },
                    modifier = Modifier
                        .background(palette.surface)
                        .border(1.dp, palette.glassBorder, RoundedCornerShape(12.dp))
                ) {
                    DropdownMenuItem(
                        text = { Text("Reply", color = palette.textPrimary, fontSize = 14.sp) },
                        onClick = {
                            onReply(message)
                            showContextMenu = false
                        },
                        leadingIcon = { Icon(Icons.Default.Reply, contentDescription = null, tint = palette.textSecondary, modifier = Modifier.size(18.dp)) }
                    )
                    DropdownMenuItem(
                        text = { Text("Forward", color = palette.textPrimary, fontSize = 14.sp) },
                        onClick = {
                            onForward(message)
                            showContextMenu = false
                        },
                        leadingIcon = { Icon(Icons.Default.Forward, contentDescription = null, tint = palette.textSecondary, modifier = Modifier.size(18.dp)) }
                    )
                    DropdownMenuItem(
                        text = { Text("Add Reaction", color = palette.textPrimary, fontSize = 14.sp) },
                        onClick = {
                            onAddReaction(message)
                            showContextMenu = false
                        },
                        leadingIcon = { Icon(Icons.Default.AddReaction, contentDescription = null, tint = palette.textSecondary, modifier = Modifier.size(18.dp)) }
                    )
                    if (message.attachments.isNotEmpty()) {
                        message.attachments.forEach { attachment ->
                            DropdownMenuItem(
                                text = { Text("Download ${attachment.name}", color = palette.textPrimary, fontSize = 14.sp) },
                                onClick = {
                                    onDownload(attachment)
                                    showContextMenu = false
                                },
                                leadingIcon = { Icon(Icons.Default.Download, contentDescription = null, tint = palette.textSecondary, modifier = Modifier.size(18.dp)) }
                            )
                        }
                    }
                    DropdownMenuItem(
                        text = { Text("Copy Text", color = palette.textPrimary, fontSize = 14.sp) },
                        onClick = {
                            // TODO: Implement copy to clipboard
                            showContextMenu = false
                        },
                        leadingIcon = { Icon(Icons.Default.ContentCopy, contentDescription = null, tint = palette.textSecondary, modifier = Modifier.size(18.dp)) }
                    )
                }
            }
        }
    }
}

@Composable
private fun SwipeActionIcon(icon: androidx.compose.ui.graphics.vector.ImageVector, palette: ChatPalette, progress: Float) {
    val scale = 0.7f + 0.3f * progress
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
    palette: ChatPalette,
    onDownload: (AttachmentDto) -> Unit = {},
    onOpenThread: () -> Unit = {},
    onAction: (MessageActionDto, Map<String, Any>) -> Unit = { _, _ -> },
    onUpdateForm: (String, Any) -> Unit = { _, _ -> },
    formState: Map<String, Any> = emptyMap(),
    isLoading: Boolean = false,
    onImageClick: (AttachmentDto) -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 6.dp)
    ) {
        AsyncImage(
            model = message.senderAvatar ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}",
            contentDescription = null,
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .border(1.dp, palette.glassBorder, CircleShape)
                .background(palette.surfaceVariant),
            contentScale = ContentScale.Crop
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = message.senderName ?: "Unknown User",
                    color = palette.textPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.5.sp
                )
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

            if (message.replyToSenderName != null) {
                Spacer(modifier = Modifier.height(3.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .width(2.dp)
                            .height(13.dp)
                            .background(palette.replyStripAccent, RoundedCornerShape(1.dp))
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Replying to ${message.replyToSenderName}",
                        color = palette.replyStripAccent,
                        fontSize = 12.sp,
                        fontStyle = FontStyle.Italic
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Render message content based on type — wrapped in a subtle
            // bubble surface for richer, more "designed" message cards,
            // while plain text stays unboxed for a lighter conversational feel.
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
                                MarkdownText(content = message.content)
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
                                    MarkdownText(content = message.content)
                                }
                            }
                        }
                    }
                }
            } else {
                MarkdownText(content = message.content)
            }

            // Attachments
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
                            Icon(Icons.Default.FilePresent, contentDescription = null, tint = palette.accent, modifier = Modifier.size(15.dp))
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

            // Reactions
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

/**
 * Formats an ISO-ish createdAt string into a short, human-friendly time.
 * Falls back to the original date-only behavior if parsing fails, so this
 * is a pure visual upgrade with no risk of crashing on unexpected formats.
 */
private fun formatMessageTimestamp(createdAt: String): String {
    return try {
        val timePart = createdAt.split("T").getOrNull(1) ?: return createdAt.split("T").getOrNull(0) ?: ""
        val hhmm = timePart.substringBefore(".").substringBefore("Z")
        val parts = hhmm.split(":")
        if (parts.size < 2) return createdAt.split("T").getOrNull(0) ?: ""
        var hour = parts[0].toIntOrNull() ?: return hhmm
        val minute = parts[1]
        val suffix = if (hour >= 12) "PM" else "AM"
        if (hour == 0) hour = 12 else if (hour > 12) hour -= 12
        "$hour:$minute $suffix"
    } catch (e: Exception) {
        createdAt.split("T").getOrNull(0) ?: createdAt
    }
}
