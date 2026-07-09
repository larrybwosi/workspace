package com.scrymechat.android.ui.chat

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.scrymechat.android.ui.components.UserAvatar
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.entities.MessageEntity
import com.scrymechat.android.data.remote.*
import com.scrymechat.android.ui.components.*
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import java.time.Duration
import java.time.Instant
import kotlin.math.roundToInt

// ─── Theme-aware palette ─────────────────────────────────────────────────────

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
            canvasBg = Color(0xFF313338),
            surface = Color(0xFF2B2D31),
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

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun ChatView(
    chatTitle: String = "",
    messages: List<MessageEntity>,
    onSendMessage: (String, String?, List<CreateAttachmentRequest>?) -> Unit,
    onReply: (MessageEntity) -> Unit,
    onOpenThread: (MessageEntity) -> Unit = {},
    onForward: (MessageEntity) -> Unit,
    onBack: () -> Unit = {},
    isThread: Boolean = false,
    threadTitle: String? = null,
    isDm: Boolean = false,
    onDownload: (AttachmentDto) -> Unit = {},
    onAction: (MessageEntity, MessageActionDto, Map<String, Any>) -> Unit = { _, _, _ -> },
    onUpdateForm: (String, String, Any) -> Unit = { _, _, _ -> },
    formStates: Map<String, Map<String, Any>> = emptyMap(),
    loadingActions: Set<String> = emptySet(),
    onTyping: () -> Unit = {},
    typingUsers: List<String>,
    pendingFiles: List<PendingFile> = emptyList(),
    isSending: Boolean = false,
    onAttach: (Uri) -> Unit = {},
    onRemoveFile: (PendingFile) -> Unit = {},
    onAvatarClick: (String) -> Unit = {},
    sessionManager: SessionManager? = null,
    modifier: Modifier = Modifier
) {
    val palette = chatPalette()
    val apiUrl by (sessionManager?.getApiUrlFlow() ?: flowOf(com.scrymechat.android.BuildConfig.API_URL))
        .map { it ?: com.scrymechat.android.BuildConfig.API_URL }
        .collectAsState(initial = com.scrymechat.android.BuildConfig.API_URL)

    var textState by remember { mutableStateOf("") }
    var replyingTo by remember { mutableStateOf<MessageEntity?>(null) }
    var fullScreenImageUrl by remember { mutableStateOf<String?>(null) }
    var fullScreenImageName by remember { mutableStateOf<String?>(null) }
    var fullScreenImageMimeType by remember { mutableStateOf<String?>(null) }
    var inputFocused by remember { mutableStateOf(false) }
    var reactionPickerMessage by remember { mutableStateOf<MessageEntity?>(null) }
    val listState = rememberLazyListState()

    // Safely scroll to bottom (item 0 in reverse layout) on message count changes
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            try {
                listState.animateScrollToItem(0)
            } catch (_: Exception) {
                // Ignore scroll exceptions during rapid layout updates
            }
        }
    }

    // Clean channel title without duplicate '#' prefix
    val cleanTitle = chatTitle.removePrefix("#")

    Column(modifier = modifier.fillMaxSize().background(palette.canvasBg)) {
        if (isThread) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
                }
                Icon(
                    imageVector = Icons.Default.Tag,
                    contentDescription = null,
                    tint = palette.accent,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = threadTitle?.removePrefix("#") ?: "Thread",
                    color = palette.textPrimary,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Divider(color = palette.divider)
        }

        // Messages List Container
        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            if (messages.isEmpty()) {
                EmptyChatState(
                    chatTitle = cleanTitle,
                    palette = palette,
                    isDm = isDm
                )
            } else {
                // messages is sorted newest-to-oldest (index 0 is newest, index N-1 is oldest).
                // Thus, the oldest unread message has the highest index among unread messages.
                // messages.indexOfLast finds the largest index (oldest message) that is unread.
                val oldestUnreadIndex = remember(messages) {
                    messages.indexOfLast { !it.readByCurrentUser }
                }

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    state = listState,
                    reverseLayout = true,
                    contentPadding = PaddingValues(top = 16.dp, bottom = 12.dp)
                ) {
                    items(
                        count = messages.size,
                        key = { index ->
                            val msgId = messages[index].id
                            if (msgId.isNotBlank()) "${msgId}_$index" else "msg_$index"
                        }
                    ) { index ->
                        val message = messages[index]
                        val prevMessage = if (index + 1 < messages.size) messages[index + 1] else null

                        val isGroupHeader = prevMessage == null ||
                                           prevMessage.senderId != message.senderId ||
                                           !isWithinGroupingTimeframe(prevMessage.createdAt, message.createdAt) ||
                                           message.replyToSenderName != null

                        Column {
                            if (index == oldestUnreadIndex) {
                                NewMessagesLine(palette = palette)
                            }

                            SwipeableMessageItem(
                                message = message,
                                isGroupHeader = isGroupHeader,
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
                                onAddReaction = { reactionPickerMessage = it },
                                onAvatarClick = onAvatarClick,
                                apiUrl = apiUrl
                            )
                        }
                    }
                }
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
                    text = if (typingUsers.size == 1) "${typingUsers[0]} is typing..." else "${typingUsers.size} people are typing...",
                    color = palette.textSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        // Input Area
        val fileLauncher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.GetContent()
        ) { uri ->
            uri?.let { onAttach(it) }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(palette.inputBarBg)
                .padding(horizontal = 10.dp, vertical = 8.dp)
        ) {
            AnimatedVisibility(
                visible = pendingFiles.isNotEmpty(),
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    pendingFiles.forEach { pending ->
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = palette.attachmentChipBg,
                            border = BorderStroke(1.dp, palette.bubbleBorder)
                        ) {
                            Box(modifier = Modifier.width(100.dp).height(100.dp)) {
                                if (pending.type.startsWith("image/")) {
                                    AsyncImage(
                                        model = pending.uri,
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(12.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Column(
                                        modifier = Modifier.fillMaxSize().padding(8.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center
                                    ) {
                                        Icon(
                                            Icons.Default.FilePresent,
                                            contentDescription = null,
                                            tint = palette.accent,
                                            modifier = Modifier.size(32.dp)
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = pending.name,
                                            color = palette.textPrimary,
                                            fontSize = 10.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }

                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .padding(4.dp)
                                        .size(22.dp)
                                        .clip(CircleShape)
                                        .background(Color.Black.copy(alpha = 0.4f))
                                        .clickable { onRemoveFile(pending) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Default.Close,
                                        contentDescription = "Remove",
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

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
                IconButton(onClick = { fileLauncher.launch("*/*") }, modifier = Modifier.size(38.dp)) {
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
                    placeholder = {
                        Text(
                            text = if (isDm) "Message @$cleanTitle" else "Message #$cleanTitle",
                            color = palette.textTertiary,
                            fontSize = 14.sp
                        )
                    },
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
                    visible = textState.isNotBlank() || pendingFiles.isNotEmpty() || isSending,
                    enter = scaleIn() + fadeIn(),
                    exit = scaleOut() + fadeOut()
                ) {
                    Box(
                        modifier = Modifier
                            .padding(3.dp)
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(palette.accentGradient))
                            .clickable(enabled = !isSending) {
                                onSendMessage(textState, replyingTo?.id, null)
                                textState = ""
                                replyingTo = null
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isSending) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
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
    }

    // Reaction Picker
    if (reactionPickerMessage != null) {
        ReactionPicker(
            onEmojiSelected = { emoji ->
                reactionPickerMessage?.let { msg ->
                    onAction(msg, MessageActionDto(id = "add_reaction", label = "Reaction", handler = MessageActionHandlerDto("CALLBACK")), mapOf("emoji" to emoji))
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
                        onDownload(
                            AttachmentDto(
                                id = "",
                                name = fullScreenImageName ?: "image.jpg",
                                url = url,
                                type = fullScreenImageMimeType ?: "image/jpeg",
                                size = 0
                            )
                        )
                    }
                }
            )
        }
    }
}

/**
 * Discord-style Empty State component for Channels and Direct Messages.
 */
@Composable
fun EmptyChatState(
    chatTitle: String,
    palette: ChatPalette,
    isDm: Boolean = false
) {
    val cleanTitle = chatTitle.removePrefix("#")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp, vertical = 28.dp),
        verticalArrangement = Arrangement.Bottom,
        horizontalAlignment = Alignment.Start
    ) {
        // Large Discord-style round icon header
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(palette.accentSoft),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (isDm) Icons.Default.Person else Icons.Default.Tag,
                contentDescription = null,
                tint = palette.accent,
                modifier = Modifier.size(40.dp)
            )
        }

        Spacer(modifier = Modifier.height(18.dp))

        // Discord-style welcome title
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Start
        ) {
            if (!isDm) {
                Icon(
                    imageVector = Icons.Default.Tag,
                    contentDescription = null,
                    tint = palette.textPrimary,
                    modifier = Modifier
                        .size(28.dp)
                        .padding(end = 4.dp)
                )
            }
            Text(
                text = if (isDm) cleanTitle else "Welcome to #$cleanTitle!",
                color = palette.textPrimary,
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = (-0.5).sp
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Discord-style explanatory subtitle
        Text(
            text = if (isDm) {
                "This is the beginning of your direct message history with @$cleanTitle. Keep it friendly and respectful!"
            } else {
                "This is the start of the #$cleanTitle channel."
            },
            color = palette.textSecondary,
            fontSize = 15.5.sp,
            lineHeight = 22.sp,
            modifier = Modifier.fillMaxWidth(0.9f)
        )

        Spacer(modifier = Modifier.height(20.dp))

        if (!isDm) {
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = palette.accentSoft,
                border = BorderStroke(1.dp, palette.accent.copy(alpha = 0.2f)),
                modifier = Modifier.clickable { /* Channel edit/settings action */ }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Edit,
                        contentDescription = null,
                        tint = palette.accent,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Edit Channel",
                        color = palette.accent,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun TypingDots(color: Color) {
    val infinite = rememberInfiniteTransition(label = "typing")
    Row(
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
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
    isGroupHeader: Boolean = true,
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
    onImageClick: (AttachmentDto) -> Unit = {},
    onAvatarClick: (String) -> Unit = {},
    apiUrl: String = "http://localhost:3000"
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
                    isGroupHeader = isGroupHeader,
                    palette = palette,
                    onDownload = onDownload,
                    onAction = onAction,
                    onUpdateForm = onUpdateForm,
                    formState = formState,
                    isLoading = isLoading,
                    onImageClick = onImageClick,
                    onOpenThread = { onOpenThread(message) },
                    onAvatarClick = onAvatarClick,
                    apiUrl = apiUrl
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
    onDownload: (AttachmentDto) -> Unit = {},
    onOpenThread: () -> Unit = {},
    onAction: (MessageActionDto, Map<String, Any>) -> Unit = { _, _ -> },
    onUpdateForm: (String, Any) -> Unit = { _, _ -> },
    formState: Map<String, Any> = emptyMap(),
    isLoading: Boolean = false,
    onImageClick: (AttachmentDto) -> Unit = {},
    onAvatarClick: (String) -> Unit = {},
    apiUrl: String = "http://localhost:3000"
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = if (isGroupHeader) 6.dp else 1.dp)
    ) {
        if (isGroupHeader) {
            UserAvatar(
                name = message.senderName ?: "User",
                avatarUrl = message.senderAvatar,
                size = 38.dp,
                modifier = Modifier.clickable { onAvatarClick(message.senderId) },
                borderColor = palette.glassBorder
            )
        } else {
            // Discord-style timestamp placeholder for grouped messages
            Box(
                modifier = Modifier.size(38.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = formatMessageTimestamp(message.createdAt, shortOnly = true),
                    color = palette.textTertiary.copy(alpha = 0.5f),
                    fontSize = 9.5.sp
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            if (isGroupHeader) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = message.senderName ?: "Unknown User",
                        color = palette.textPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp,
                        modifier = Modifier.clickable { onAvatarClick(message.senderId) }
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
            }

            // Render Message Body safely
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
                                MarkdownText(content = message.content.ifEmpty { " " })
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
                                    MarkdownText(content = message.content.ifEmpty { " " })
                                }
                            }
                        }
                    }
                }
            } else {
                if (message.content.isNotBlank()) {
                    MarkdownText(content = message.content)
                }
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

private fun isWithinGroupingTimeframe(time1: String, time2: String): Boolean {
    return try {
        val instant1 = Instant.parse(time1)
        val instant2 = Instant.parse(time2)
        Duration.between(instant1, instant2).abs().toMinutes() < 5
    } catch (e: Exception) {
        false
    }
}

/**
 * Robust timestamp formatter for message headers and compact mode.
 */
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

/**
 * Discord-style New Messages line separator.
 */
@Composable
fun NewMessagesLine(palette: ChatPalette) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp, horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(Color(0xFFF23F43))
        )
        Spacer(modifier = Modifier.width(8.dp))
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(4.dp))
                .background(Color(0xFFF23F43))
                .padding(horizontal = 8.dp, vertical = 3.dp)
        ) {
            Text(
                text = "NEW",
                color = Color.White,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
        }
        Spacer(modifier = Modifier.width(8.dp))
        Box(
            modifier = Modifier
                .width(16.dp)
                .height(1.dp)
                .background(Color(0xFFF23F43))
        )
    }
}
