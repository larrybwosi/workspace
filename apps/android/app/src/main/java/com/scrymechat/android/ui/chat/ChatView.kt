package com.scrymechat.android.ui.chat

import android.net.Uri
import android.widget.Toast
import android.content.ClipboardManager
import android.content.ClipData
import android.content.Context
import androidx.compose.ui.text.input.TextFieldValue
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.remote.UserDto
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
import kotlinx.coroutines.launch
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

/**
 * Animated pulse skeleton placeholder for messages.
 */
@Composable
fun MessageSkeleton(palette: ChatPalette) {
    val infiniteTransition = rememberInfiniteTransition(label = "skeleton")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        // Avatar skeleton
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(palette.textSecondary.copy(alpha = alpha))
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Name skeleton
                Box(
                    modifier = Modifier
                        .size(width = 80.dp, height = 14.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(palette.textSecondary.copy(alpha = alpha))
                )
                Spacer(modifier = Modifier.width(8.dp))
                // Timestamp skeleton
                Box(
                    modifier = Modifier
                        .size(width = 40.dp, height = 10.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(palette.textTertiary.copy(alpha = alpha))
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            // Text line 1
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .height(14.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(palette.textSecondary.copy(alpha = alpha))
            )
            Spacer(modifier = Modifier.height(6.dp))
            // Text line 2
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.55f)
                    .height(14.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(palette.textSecondary.copy(alpha = alpha))
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessageContextBottomSheet(
    message: MessageEntity,
    currentUserId: String?,
    onDismiss: () -> Unit,
    onReply: () -> Unit,
    onForward: () -> Unit,
    onAddReaction: (String) -> Unit,
    onCopyText: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onDownload: ((AttachmentDto) -> Unit)? = null
) {
    val quickEmojis = listOf("👍", "❤️", "😂", "😮", "😢", "🔥", "✅")

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            // Quick reactions row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                quickEmojis.forEach { emoji ->
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .clickable {
                                onAddReaction(emoji)
                                onDismiss()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = emoji, fontSize = 24.sp)
                    }
                }
            }

            HorizontalDivider(
                color = MaterialTheme.colorScheme.outlineVariant,
                thickness = 1.dp,
                modifier = Modifier.padding(vertical = 8.dp)
            )

            // Menu Items
            ContextMenuItem(
                icon = Icons.Default.Reply,
                label = "Reply",
                onClick = onReply
            )

            ContextMenuItem(
                icon = Icons.Default.Forward,
                label = "Forward",
                onClick = onForward
            )

            ContextMenuItem(
                icon = Icons.Default.ContentCopy,
                label = "Copy Text",
                onClick = onCopyText
            )

            if (onDownload != null && message.attachments.isNotEmpty()) {
                message.attachments.forEach { attachment ->
                    ContextMenuItem(
                        icon = Icons.Default.Download,
                        label = "Download ${attachment.name}",
                        onClick = { onDownload(attachment) }
                    )
                }
            }

            val isOwnMessage = currentUserId != null && message.senderId == currentUserId

            if (isOwnMessage) {
                ContextMenuItem(
                    icon = Icons.Default.Edit,
                    label = "Edit Message",
                    onClick = onEdit
                )

                ContextMenuItem(
                    icon = Icons.Default.Delete,
                    label = "Delete Message",
                    color = MaterialTheme.colorScheme.error,
                    onClick = onDelete
                )
            }
        }
    }
}

@Composable
private fun ContextMenuItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: Color = MaterialTheme.colorScheme.onSurface,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = color,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(14.dp))
        Text(
            text = label,
            color = color,
            fontSize = 15.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditMessageDialog(
    initialText: String,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var text by remember { mutableStateOf(initialText) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Message") },
        text = {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                modifier = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            Button(onClick = { onConfirm(text) }) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun DeleteMessageConfirmationDialog(
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delete Message") },
        text = { Text("Are you sure you want to delete this message? This cannot be undone.") },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Text("Delete")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

/**
 * Discord-style "Forward Message" bottom sheet. Shows a mini preview of the message
 * being forwarded, a searchable/multi-select list of destination channels, an
 * optional comment field, and a confirm button — matching Discord's forward flow
 * (select a message → Forward → pick one or more channels/DMs → optionally add a
 * comment → Forward).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ForwardPickerBottomSheet(
    message: MessageEntity,
    channels: List<ChannelEntity>,
    palette: ChatPalette,
    onDismiss: () -> Unit,
    onConfirm: (List<ChannelEntity>, String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    val selectedChannelIds = remember { mutableStateListOf<String>() }
    var comment by remember { mutableStateOf(TextFieldValue("")) }

    val filteredChannels = remember(channels, searchQuery) {
        channels.filter {
            it.type != "category" && it.name.contains(searchQuery, ignoreCase = true)
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = palette.surface,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 20.dp)
        ) {
            Text(
                text = "Forward Message",
                color = palette.textPrimary,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Mini preview of the message being forwarded
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(palette.attachmentChipBg)
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                UserAvatar(
                    name = message.senderName ?: "Unknown User",
                    avatarUrl = message.senderAvatar,
                    size = 28.dp,
                    borderColor = Color.Transparent
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = message.senderName ?: "Unknown User",
                        color = palette.textPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    val preview = message.content.takeIf { it.isNotBlank() }
                        ?: message.attachments.firstOrNull()?.let { attachment ->
                            if (attachment.type.startsWith("image/")) "\uD83D\uDCF7 Photo" else "\uD83D\uDCCE ${attachment.name}"
                        }
                        ?: "Message"
                    Text(
                        text = preview,
                        color = palette.textSecondary,
                        fontSize = 12.5.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                placeholder = { Text("Find a channel...", color = palette.textTertiary, fontSize = 13.sp) },
                singleLine = true,
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null, tint = palette.textTertiary, modifier = Modifier.size(18.dp))
                },
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = palette.inputFieldBorderFocused,
                    unfocusedBorderColor = palette.inputFieldBorder,
                    focusedTextColor = palette.textPrimary,
                    unfocusedTextColor = palette.textPrimary
                )
            )

            Spacer(modifier = Modifier.height(4.dp))

            LazyColumn(modifier = Modifier.heightIn(max = 260.dp)) {
                items(
                    count = filteredChannels.size,
                    key = { index -> filteredChannels[index].id }
                ) { index ->
                    val channel = filteredChannels[index]
                    val isSelected = selectedChannelIds.contains(channel.id)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (isSelected) selectedChannelIds.remove(channel.id)
                                else selectedChannelIds.add(channel.id)
                            }
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Tag,
                            contentDescription = null,
                            tint = palette.textTertiary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = channel.name,
                            color = palette.textPrimary,
                            fontSize = 14.5.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.weight(1f)
                        )
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(CircleShape)
                                .background(if (isSelected) palette.accent else Color.Transparent)
                                .border(1.5.dp, if (isSelected) palette.accent else palette.textTertiary, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isSelected) {
                                Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(13.dp))
                            }
                        }
                    }
                }

                if (filteredChannels.isEmpty()) {
                    item {
                        Text(
                            text = "No channels found",
                            color = palette.textTertiary,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            OutlinedTextField(
                value = comment,
                onValueChange = { comment = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                placeholder = { Text("Add a comment...", color = palette.textTertiary, fontSize = 13.sp) },
                shape = RoundedCornerShape(10.dp),
                maxLines = 3,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = palette.inputFieldBorderFocused,
                    unfocusedBorderColor = palette.inputFieldBorder,
                    focusedTextColor = palette.textPrimary,
                    unfocusedTextColor = palette.textPrimary
                )
            )

            Spacer(modifier = Modifier.height(10.dp))

            Button(
                onClick = {
                    val selectedChannels = channels.filter { selectedChannelIds.contains(it.id) }
                    onConfirm(selectedChannels, comment.text)
                },
                enabled = selectedChannelIds.isNotEmpty(),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = palette.accent)
            ) {
                Text(
                    text = if (selectedChannelIds.size > 1) "Forward to ${selectedChannelIds.size} channels" else "Forward",
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun ThreadStarterDivider(palette: ChatPalette) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp, horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(palette.divider)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "End of Thread",
            color = palette.textTertiary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
        Spacer(modifier = Modifier.width(8.dp))
        Box(
            modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(palette.divider)
        )
    }
}

private val ShapeInputBar = RoundedCornerShape(22.dp)

// ──────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun ChatView(
    chatTitle: String = "",
    messages: List<MessageEntity>,
    isLoading: Boolean = false,
    onSendMessage: (String, String?, List<CreateAttachmentRequest>?) -> Unit,
    onReply: (MessageEntity) -> Unit,
    onOpenThread: (MessageEntity) -> Unit = {},
    onForward: (MessageEntity) -> Unit,
    // Fires once the user picks destination channel(s) (and optional comment) from the
    // Discord-style forward sheet. Defaults to calling the legacy onForward once per
    // message for callers that haven't wired up multi-channel forwarding yet.
    onForwardToChannels: (MessageEntity, List<ChannelEntity>, String) -> Unit = { message, _, _ -> onForward(message) },
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
    channels: List<ChannelEntity> = emptyList(),
    suggestedUsers: List<UserDto> = emptyList(),
    onSearchUsers: (String) -> Unit = {},
    onClearSuggestedUsers: () -> Unit = {},
    onMentionClick: (String) -> Unit = {},
    onChannelTagClick: (String) -> Unit = {},
    onEditMessage: (MessageEntity, String) -> Unit = { _, _ -> },
    onDeleteMessage: (MessageEntity) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val palette = chatPalette()
    val context = LocalContext.current
    val currentUserId by (sessionManager?.getActiveSessionFlow() ?: flowOf(null))
        .map { it?.userId }
        .collectAsState(initial = null)
    val apiUrl by (sessionManager?.getApiUrlFlow() ?: flowOf(com.scrymechat.android.BuildConfig.API_URL))
        .map { it ?: com.scrymechat.android.BuildConfig.API_URL }
        .collectAsState(initial = com.scrymechat.android.BuildConfig.API_URL)

    val scope = rememberCoroutineScope()
    var textState by remember { mutableStateOf(TextFieldValue("")) }
    var replyingTo by remember { mutableStateOf<MessageEntity?>(null) }
    var forwardingMessage by remember { mutableStateOf<MessageEntity?>(null) }
    var fullScreenImageUrl by remember { mutableStateOf<String?>(null) }
    var fullScreenImageName by remember { mutableStateOf<String?>(null) }
    var fullScreenImageMimeType by remember { mutableStateOf<String?>(null) }
    var inputFocused by remember { mutableStateOf(false) }
    var reactionPickerMessage by remember { mutableStateOf<MessageEntity?>(null) }
    var highlightedMessageId by remember { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()

    val mentionQuery = remember(textState) {
        getMentionQuery(textState.text, textState.selection.end)
    }

    LaunchedEffect(mentionQuery) {
        if (mentionQuery != null && mentionQuery.trigger == '@') {
            onSearchUsers(mentionQuery.query)
        } else {
            onClearSuggestedUsers()
        }
    }

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
        if (chatTitle.isBlank() && messages.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = palette.accent)
            }
            return@Column
        }

        if (isThread) {
            Surface(
                color = palette.surface,
                shadowElevation = 2.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
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
                        imageVector = Icons.Default.ChatBubbleOutline,
                        contentDescription = null,
                        tint = palette.accent,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = threadTitle?.removePrefix("#") ?: "Thread",
                            color = palette.textPrimary,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "in #$cleanTitle",
                            color = palette.textSecondary,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }

        val currentChatKey = remember(chatTitle, isThread, isDm) {
            "${chatTitle}_${isThread}_${isDm}"
        }

        var initialOldestUnreadMessageId by remember(currentChatKey) {
            mutableStateOf<String?>(null)
        }

        var hasCalculatedUnread by remember(currentChatKey) {
            mutableStateOf(false)
        }

        LaunchedEffect(messages, currentChatKey) {
            if (messages.isNotEmpty()) {
                val oldestUnread = messages.lastOrNull { !it.readByCurrentUser }
                if (oldestUnread == null) {
                    initialOldestUnreadMessageId = null
                } else if (!hasCalculatedUnread) {
                    initialOldestUnreadMessageId = oldestUnread.id
                    hasCalculatedUnread = true
                } else {
                    val isStillUnread = messages.any { it.id == initialOldestUnreadMessageId && !it.readByCurrentUser }
                    if (!isStillUnread) {
                        initialOldestUnreadMessageId = null
                    }
                }
            } else {
                initialOldestUnreadMessageId = null
            }
        }

        // Messages List Container
        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            if (isLoading && messages.isEmpty()) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    reverseLayout = true,
                    contentPadding = PaddingValues(top = 16.dp, bottom = 12.dp)
                ) {
                    items(5) {
                        MessageSkeleton(palette = palette)
                    }
                }
            } else if (messages.isEmpty()) {
                EmptyChatState(
                    chatTitle = cleanTitle,
                    palette = palette,
                    isDm = isDm
                )
            } else {
                val oldestUnreadIndex = remember(messages, initialOldestUnreadMessageId) {
                    if (initialOldestUnreadMessageId != null) {
                        messages.indexOfFirst { it.id == initialOldestUnreadMessageId }
                    } else {
                        -1
                    }
                }

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    state = listState,
                    reverseLayout = true,
                    contentPadding = PaddingValues(top = 16.dp, bottom = 12.dp)
                ) {
                    if (isThread) {
                        item {
                            ThreadStarterDivider(palette = palette)
                        }
                    }

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

                        val repliedMessage = remember(message.replyToId, messages) {
                            if (message.replyToId != null) {
                                messages.find { it.id == message.replyToId }
                            } else {
                                null
                            }
                        }

                        Column {
                            if (index == oldestUnreadIndex) {
                                NewMessagesLine(palette = palette)
                            }

                            SwipeableMessageItem(
                                message = message,
                                isGroupHeader = isGroupHeader,
                                palette = palette,
                                repliedMessage = repliedMessage,
                                onReplyClick = { replyToId ->
                                    val targetIndex = messages.indexOfFirst { it.id == replyToId }
                                    if (targetIndex != -1) {
                                        highlightedMessageId = replyToId
                                        scope.launch {
                                            try {
                                                listState.animateScrollToItem(targetIndex)
                                            } catch (_: Exception) {}
                                            kotlinx.coroutines.delay(1500)
                                            if (highlightedMessageId == replyToId) {
                                                highlightedMessageId = null
                                            }
                                        }
                                    }
                                },
                                onReply = {
                                    replyingTo = it
                                    onReply(it)
                                },
                                onOpenThread = onOpenThread,
                                // Swipe-to-forward and the context menu's "Forward" item both land
                                // here first — this opens the Discord-style channel picker sheet
                                // rather than forwarding immediately, so the user can choose where
                                // it goes (and optionally add a comment) before anything is sent.
                                onForward = { forwardingMessage = it },
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
                                apiUrl = apiUrl,
                                onMentionClick = onMentionClick,
                                onChannelTagClick = onChannelTagClick,
                                onEditMessage = onEditMessage,
                                onDeleteMessage = onDeleteMessage,
                                currentUserId = currentUserId,
                                highlightedMessageId = highlightedMessageId
                            )
                        }
                    }
                }
            }

            // Suggestions Overlay
            val isSuggestionsVisible = (mentionQuery != null && (mentionQuery.trigger == '#' || (mentionQuery.trigger == '@' && suggestedUsers.isNotEmpty())))

            if (isSuggestionsVisible) {
                Surface(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                        .heightIn(max = 200.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = palette.surface,
                    border = BorderStroke(1.dp, palette.glassBorder),
                    tonalElevation = 6.dp
                ) {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(vertical = 4.dp)
                    ) {
                        if (mentionQuery?.trigger == '@') {
                            items(
                                count = suggestedUsers.size,
                                key = { index -> suggestedUsers[index].id }
                            ) { index ->
                                val user = suggestedUsers[index]
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            val username = user.username ?: user.name
                                            val replacement = "@$username "
                                            val newText = textState.text.replaceRange(
                                                mentionQuery.startIndex,
                                                textState.selection.end,
                                                replacement
                                            )
                                            textState = TextFieldValue(
                                                text = newText,
                                                selection = androidx.compose.ui.text.TextRange(mentionQuery.startIndex + replacement.length)
                                            )
                                            onClearSuggestedUsers()
                                        }
                                        .padding(horizontal = 14.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    UserAvatar(
                                        name = user.name,
                                        avatarUrl = user.avatar ?: user.image,
                                        size = 32.dp,
                                        borderColor = palette.glassBorder
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(
                                            text = user.name,
                                            color = palette.textPrimary,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        user.username?.let {
                                            Text(
                                                text = "@$it",
                                                color = palette.textSecondary,
                                                fontSize = 12.sp
                                            )
                                        }
                                    }
                                }
                            }
                        } else if (mentionQuery?.trigger == '#') {
                            val matchedChannels = channels.filter {
                                it.type != "category" && it.name.contains(mentionQuery.query, ignoreCase = true)
                            }
                            items(
                                count = matchedChannels.size,
                                key = { index -> matchedChannels[index].id }
                            ) { index ->
                                val channel = matchedChannels[index]
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            val replacement = "#${channel.name} "
                                            val newText = textState.text.replaceRange(
                                                mentionQuery.startIndex,
                                                textState.selection.end,
                                                replacement
                                            )
                                            textState = TextFieldValue(
                                                text = newText,
                                                selection = androidx.compose.ui.text.TextRange(mentionQuery.startIndex + replacement.length)
                                            )
                                        }
                                        .padding(horizontal = 14.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Tag,
                                        contentDescription = null,
                                        tint = palette.accent,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(
                                        text = channel.name,
                                        color = palette.textPrimary,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
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
                        if (it.text.isNotEmpty()) onTyping()
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
                    visible = textState.text.isNotBlank() || pendingFiles.isNotEmpty() || isSending,
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
                                onSendMessage(textState.text, replyingTo?.id, null)
                                textState = TextFieldValue("")
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

    // Forward Picker — Discord-style destination sheet, shown whenever a message is
    // swiped or long-pressed to forward. Sending only happens once the user confirms
    // a destination here; nothing is forwarded implicitly on swipe alone.
    forwardingMessage?.let { message ->
        ForwardPickerBottomSheet(
            message = message,
            channels = channels,
            palette = palette,
            onDismiss = { forwardingMessage = null },
            onConfirm = { selectedChannels, comment ->
                onForwardToChannels(message, selectedChannels, comment)
                val confirmationText = if (selectedChannels.size > 1) {
                    "Forwarded to ${selectedChannels.size} channels"
                } else {
                    "Forwarded to #${selectedChannels.firstOrNull()?.name ?: "channel"}"
                }
                Toast.makeText(context, confirmationText, Toast.LENGTH_SHORT).show()
                forwardingMessage = null
            }
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

data class MentionQuery(val trigger: Char, val query: String, val startIndex: Int)

fun getMentionQuery(text: String, selectionIndex: Int): MentionQuery? {
    if (selectionIndex < 0 || selectionIndex > text.length) return null
    var i = selectionIndex - 1
    while (i >= 0) {
        val char = text[i]
        if (char == ' ' || char == '\n') {
            break
        }
        if (char == '@' || char == '#') {
            if (i == 0 || text[i - 1] == ' ' || text[i - 1] == '\n') {
                return MentionQuery(char, text.substring(i + 1, selectionIndex), i)
            }
            break
        }
        i--
    }
    return null
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
                text = "NEW MESSAGES",
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
