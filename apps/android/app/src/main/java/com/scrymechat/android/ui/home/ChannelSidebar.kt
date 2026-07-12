package com.scrymechat.android.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material.ripple.rememberRipple
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceEntity
import com.scrymechat.android.ui.components.UserAvatar

/**
 * Exact Discord design tokens for dark themes, extended with a couple of
 * "premium" depth tokens (soft glows, elevated surfaces) that vanilla
 * Discord fakes with layered blurs.
 */
object SidebarTokens {
    val SurfaceBase = Color(0xFF2B2D31)       // Channel list container
    val SurfaceRaised = Color(0xFF313338)     // Header / Raised chrome
    val SurfaceSelected = Color(0xFF3F4248)   // Active channel row (slightly lifted vs stock Discord)
    val SurfaceHover = Color(0xFF34363C)      // Hover/Pressed state
    val SurfaceFooter = Color(0xFF232428)     // User bar at the bottom
    val SurfaceIconIdle = Color(0xFF232428)   // Idle icon chip background

    val Hairline = Color(0x33000000)
    val HairlineStrong = Color(0x24FFFFFF)

    val Accent = Color(0xFF5865F2)            // Blurple
    val AccentSoft = Color(0x335865F2)        // Blurple glow
    val Online = Color(0xFF23A55A)            // Status Green
    val Danger = Color(0xFFF23F43)            // Notification Badge Red

    val TextBright = Color(0xFFFFFFFF)        // Selected / Unread label
    val TextPrimary = Color(0xFFA6ABB4)       // Normal channel color (slightly brighter for contrast)
    val TextCategory = Color(0xFF96999E)      // Category titles
    val TextMuted = Color(0xFF949BA4)
    val TextFaint = Color(0xFF84898F)         // Channel icons idle tint

    val PillIndicator = Color(0xFFFFFFFF)

    val HeaderGradient = Brush.verticalGradient(
        colors = listOf(Color(0xFF35373C), Color(0xFF2F3136))
    )
    val FooterGradient = Brush.verticalGradient(
        colors = listOf(Color(0xFF232428), Color(0xFF1E1F22))
    )
}

fun presenceColor(status: String?): Color = when (status?.lowercase()) {
    "online" -> Color(0xFF23A55A)
    "idle", "away" -> Color(0xFFF0B232)
    "dnd", "busy" -> Color(0xFFF23F43)
    else -> Color(0xFF80848E)
}

/** Helper data structure for category grouping */
private data class ChannelCategoryGroup(
    val categoryId: String,
    val name: String,
    val channels: List<ChannelEntity>
)

/** Which glyph a channel row should show */
private fun channelLeadingIcon(channel: ChannelEntity): Any {
    if (!channel.icon.isNullOrEmpty() && channel.icon != "#") return channel.icon
    return when (channel.type?.lowercase()) {
        "voice" -> Icons.AutoMirrored.Filled.VolumeUp
        "announcement" -> Icons.Default.Campaign
        "stage" -> Icons.Default.RecordVoiceOver
        "forum" -> Icons.AutoMirrored.Filled.Chat
        else -> Icons.Default.Tag
    }
}

@Composable
fun ChannelSidebar(
    workspace: WorkspaceEntity?,
    channels: List<ChannelEntity>,
    selectedChannel: ChannelEntity?,
    isHomeSelected: Boolean,
    currentUser: UserEntity?,
    expandedCategories: Set<String>,
    dms: List<com.scrymechat.android.data.local.dao.DmWithUser> = emptyList(),
    selectedDm: com.scrymechat.android.data.local.dao.DmWithUser? = null,
    onChannelClick: (ChannelEntity) -> Unit,
    onDmClick: (com.scrymechat.android.data.local.dao.DmWithUser) -> Unit = {},
    onCategoryToggle: (String) -> Unit,
    onSettingsClick: () -> Unit,
    onFriendsClick: () -> Unit = {},
    onCreateChannelClick: () -> Unit = {}
) {
    // Compute category grouping once per channel list change so we can both
    // render it and use it to seed the default-expanded state below.
    val (uncategorized, groupedCategories) = remember(channels) {
        processChannelGrouping(channels)
    }

    // Categories should read as "expanded" the first time they're seen,
    // matching Discord's own behavior of never starting a server collapsed.
    // We only ever push categories INTO expandedCategories here — we never
    // touch ones the user has since collapsed by hand.
    LaunchedEffect(groupedCategories) {
        groupedCategories.forEach { category ->
            if (category.categoryId !in expandedCategories) {
                onCategoryToggle(category.categoryId)
            }
        }
    }

    Column(
        modifier = Modifier
            .width(240.dp)
            .fillMaxHeight()
            .background(SidebarTokens.SurfaceBase)
    ) {
        // --- 1. Top Header ---
        SidebarHeader(
            title = if (isHomeSelected) "Direct Messages" else (workspace?.name ?: "Server"),
            subtitle = null
        )

        HorizontalDivider(color = SidebarTokens.Hairline, thickness = 1.dp)

        // --- 2. Main Content List ---
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            if (isHomeSelected) {
                // Direct Messages / Home View
                item {
                    PaddingWrapper {
                        SidebarItem(
                            icon = Icons.Default.Person,
                            label = "Friends",
                            isSelected = selectedDm == null,
                            onClick = onFriendsClick
                        )
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    SectionLabel(text = "Direct Messages")
                }

                items(dms, key = { "sidebar_dm_${it.dm.id}" }) { dmWithUser ->
                    val isSelected = selectedDm?.dm?.id == dmWithUser.dm.id
                    val displayName = dmWithUser.otherUserName ?: "Unknown User"
                    PaddingWrapper {
                        SidebarItem(
                            icon = null,
                            label = displayName,
                            isSelected = isSelected,
                            unreadCount = dmWithUser.dm.unreadCount,
                            avatarUrl = dmWithUser.otherUserAvatar ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=${dmWithUser.dm.otherUserId}",
                            status = dmWithUser.otherUserStatus,
                            onClick = { onDmClick(dmWithUser) }
                        )
                    }
                }
            } else {
                // Workspace / Server Channels View

                // Render Uncategorized Channels
                if (uncategorized.isNotEmpty()) {
                    items(uncategorized, key = { it.id }) { channel ->
                        PaddingWrapper {
                            ChannelItem(
                                channel = channel,
                                isSelected = selectedChannel?.id == channel.id,
                                onClick = { onChannelClick(channel) }
                            )
                        }
                    }
                    item { Spacer(modifier = Modifier.height(8.dp)) }
                }

                // Render Categorized Channels
                groupedCategories.forEach { category ->
                    val isExpanded = expandedCategories.contains(category.categoryId)
                    val hasUnread = category.channels.any { it.unreadCount > 0 }

                    item(key = "cat_${category.categoryId}") {
                        CategoryHeader(
                            name = category.name,
                            isExpanded = isExpanded,
                            hasUnread = hasUnread && !isExpanded,
                            onToggle = { onCategoryToggle(category.categoryId) },
                            onAddClick = onCreateChannelClick
                        )
                    }

                    item(key = "cat_body_${category.categoryId}") {
                        AnimatedVisibility(
                            visible = isExpanded,
                            enter = expandVertically(
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioLowBouncy,
                                    stiffness = Spring.StiffnessMediumLow
                                )
                            ) + fadeIn(tween(180)),
                            exit = shrinkVertically(animationSpec = tween(150)) + fadeOut(tween(100))
                        ) {
                            Column {
                                category.channels.forEach { channel ->
                                    PaddingWrapper {
                                        ChannelItem(
                                            channel = channel,
                                            isSelected = selectedChannel?.id == channel.id,
                                            onClick = { onChannelClick(channel) }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    PaddingWrapper {
                        CreateChannelRow(onClick = onCreateChannelClick)
                    }
                }
            }
        }

        // --- 3. User Footer Section ---
        UserSection(currentUser = currentUser, onSettingsClick = onSettingsClick)
    }
}

/**
 * Organizes raw channels into logical Discord categories (Text vs Voice or Parent Categories).
 */
private fun processChannelGrouping(channels: List<ChannelEntity>): Pair<List<ChannelEntity>, List<ChannelCategoryGroup>> {
    val categoryEntities = channels.filter { it.type?.lowercase() == "category" }
    val normalChannels = channels.filter { it.type?.lowercase() != "category" }

    if (categoryEntities.isNotEmpty()) {
        val uncategorized = normalChannels.filter { it.parentId == null }
        val grouped = categoryEntities.map { cat ->
            ChannelCategoryGroup(
                categoryId = cat.id,
                name = cat.name,
                channels = normalChannels.filter { it.parentId == cat.id }
            )
        }
        return Pair(uncategorized, grouped)
    }

    // Fallback: If no explicit category entity exists, group by type like standard Discord
    val textChannels = normalChannels.filter { it.type?.lowercase() != "voice" }
    val voiceChannels = normalChannels.filter { it.type?.lowercase() == "voice" }

    val defaultGroups = mutableListOf<ChannelCategoryGroup>()
    if (textChannels.isNotEmpty()) {
        defaultGroups.add(ChannelCategoryGroup("cat_text_default", "Text Channels", textChannels))
    }
    if (voiceChannels.isNotEmpty()) {
        defaultGroups.add(ChannelCategoryGroup("cat_voice_default", "Voice Channels", voiceChannels))
    }

    return Pair(emptyList(), defaultGroups)
}

@Composable
private fun PaddingWrapper(content: @Composable () -> Unit) {
    Box(modifier = Modifier.padding(start = 8.dp, end = 8.dp, top = 1.dp, bottom = 1.dp)) {
        content()
    }
}

@Composable
private fun SidebarHeader(title: String, subtitle: String?) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color.Transparent
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(SidebarTokens.HeaderGradient)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = rememberRipple(color = SidebarTokens.SurfaceHover)
                    ) { }
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        color = SidebarTokens.TextBright,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (subtitle != null) {
                        Text(
                            text = subtitle,
                            color = SidebarTokens.TextPrimary,
                            fontWeight = FontWeight.Medium,
                            fontSize = 11.sp
                        )
                    }
                }
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.06f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowDown,
                        contentDescription = "Server Menu",
                        tint = SidebarTokens.TextBright,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            // Subtle 1px sheen at the very top edge — the kind of detail that
            // reads as "designed" rather than "default component".
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(Color.White.copy(alpha = 0.04f))
                    .align(Alignment.TopCenter)
            )
        }
    }
}

@Composable
private fun SectionLabel(text: String, trailing: (@Composable () -> Unit)? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 16.dp, end = 12.dp, top = 12.dp, bottom = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = text.uppercase(),
            color = SidebarTokens.TextCategory,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.4.sp
        )
        trailing?.invoke()
    }
}

@Composable
fun CategoryHeader(
    name: String,
    isExpanded: Boolean,
    hasUnread: Boolean = false,
    onToggle: () -> Unit,
    onAddClick: () -> Unit = {}
) {
    val rotation by animateFloatAsState(
        targetValue = if (isExpanded) 0f else -90f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "chevronRotation"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(4.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = rememberRipple(color = SidebarTokens.SurfaceHover)
            ) { onToggle() }
            .padding(start = 8.dp, end = 12.dp, top = 14.dp, bottom = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.KeyboardArrowDown,
            contentDescription = null,
            tint = SidebarTokens.TextCategory,
            modifier = Modifier
                .size(12.dp)
                .rotate(rotation)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = name.uppercase(),
            color = SidebarTokens.TextCategory,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.4.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f)
        )
        if (hasUnread) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(SidebarTokens.Danger)
            )
            Spacer(modifier = Modifier.width(6.dp))
        }
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = "Create Channel",
            tint = SidebarTokens.TextCategory,
            modifier = Modifier
                .size(16.dp)
                .clip(CircleShape)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = rememberRipple(bounded = false, radius = 12.dp)
                ) { onAddClick() }
        )
    }
}

@Composable
private fun CreateChannelRow(onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
            .clip(RoundedCornerShape(6.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = rememberRipple(color = SidebarTokens.SurfaceHover)
            ) { onClick() }
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(18.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(SidebarTokens.SurfaceIconIdle),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = null,
                tint = SidebarTokens.TextFaint,
                modifier = Modifier.size(12.dp)
            )
        }
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "Create Channel",
            color = SidebarTokens.TextPrimary,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun ChannelItem(
    channel: ChannelEntity,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    SidebarItem(
        icon = channelLeadingIcon(channel),
        label = channel.name,
        isSelected = isSelected,
        unreadCount = channel.unreadCount,
        onClick = onClick
    )
}

/**
 * Core list item with the iconic Discord pill indicator on the left edge,
 * plus a soft glow behind it and a subtle press-scale for a more premium,
 * tactile feel than a flat background swap.
 */
@Composable
fun SidebarItem(
    icon: Any?,
    label: String,
    isSelected: Boolean,
    unreadCount: Int = 0,
    avatarUrl: String? = null,
    status: String? = null,
    onClick: () -> Unit
) {
    val isUnread = unreadCount > 0 && !isSelected
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) SidebarTokens.SurfaceSelected else Color.Transparent,
        animationSpec = tween(120),
        label = "itemBg"
    )
    val contentColor by animateColorAsState(
        targetValue = when {
            isSelected || isUnread -> SidebarTokens.TextBright
            else -> SidebarTokens.TextPrimary
        },
        animationSpec = tween(120),
        label = "itemText"
    )
    val iconColor by animateColorAsState(
        targetValue = when {
            isSelected -> SidebarTokens.TextBright
            isUnread -> SidebarTokens.TextBright
            else -> SidebarTokens.TextFaint
        },
        animationSpec = tween(120),
        label = "itemIcon"
    )
    val iconChipColor by animateColorAsState(
        targetValue = if (isSelected) SidebarTokens.Accent.copy(alpha = 0.18f) else SidebarTokens.SurfaceIconIdle,
        animationSpec = tween(120),
        label = "itemIconChip"
    )
    val pillHeight by animateDpAsState(
        targetValue = when {
            isSelected -> 20.dp
            isUnread -> 8.dp
            else -> 0.dp
        },
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "itemPill"
    )
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessHigh),
        label = "itemScale"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
            .scale(scale)
    ) {
        // Soft glow behind the pill for selected rows — a small touch that
        // reads as "premium" without being loud.
        if (isSelected) {
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .offset(x = (-10).dp)
                    .size(width = 10.dp, height = 26.dp)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(SidebarTokens.AccentSoft, Color.Transparent)
                        )
                    )
            )
        }

        // Discord Pill Indicator (Left edge gutter)
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .offset(x = (-8).dp)
                .width(4.dp)
                .height(pillHeight)
                .clip(RoundedCornerShape(topEnd = 4.dp, bottomEnd = 4.dp))
                .background(SidebarTokens.PillIndicator)
        )

        // Row Content Card
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(6.dp))
                .clickable(
                    interactionSource = interactionSource,
                    indication = rememberRipple(color = SidebarTokens.SurfaceHover)
                ) { onClick() },
            color = backgroundColor
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 8.dp)
            ) {
                if (avatarUrl != null) {
                    Box(modifier = Modifier.size(24.dp)) {
                        UserAvatar(
                            name = label,
                            avatarUrl = avatarUrl,
                            size = 24.dp,
                            borderColor = Color.Transparent
                        )
                        if (status != null) {
                            Box(
                                modifier = Modifier
                                    .size(9.dp)
                                    .align(Alignment.BottomEnd)
                                    .clip(CircleShape)
                                    .background(SidebarTokens.SurfaceBase)
                                    .padding(1.5.dp)
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
                } else {
                    // Icons sit in a soft rounded chip instead of floating bare —
                    // gives channels a bit of "product" weight like Nitro server
                    // boosts / custom channel icons do in real Discord.
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(RoundedCornerShape(7.dp))
                            .background(iconChipColor),
                        contentAlignment = Alignment.Center
                    ) {
                        when (icon) {
                            is ImageVector -> Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = iconColor,
                                modifier = Modifier.size(14.dp)
                            )
                            is String -> Text(
                                text = icon,
                                color = iconColor,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )
                            else -> {}
                        }
                    }
                }

                Spacer(modifier = Modifier.width(10.dp))

                Text(
                    text = label,
                    color = contentColor,
                    fontSize = 14.sp,
                    fontWeight = if (isSelected || isUnread) FontWeight.SemiBold else FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )

                if (unreadCount > 0) {
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .height(16.dp)
                            .widthIn(min = 16.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(SidebarTokens.Danger)
                            .padding(horizontal = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (unreadCount > 99) "99+" else unreadCount.toString(),
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun UserSection(
    currentUser: UserEntity?,
    onSettingsClick: () -> Unit
) {
    Column {
        HorizontalDivider(color = SidebarTokens.Hairline, thickness = 1.dp)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .background(SidebarTokens.FooterGradient)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(6.dp))
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = rememberRipple(color = SidebarTokens.SurfaceHover)
                        ) { onSettingsClick() }
                        .padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(34.dp)) {
                        // Faint accent ring behind the avatar — a small
                        // "premium account" flourish.
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .background(
                                    Brush.sweepGradient(
                                        colors = listOf(
                                            SidebarTokens.Accent.copy(alpha = 0.5f),
                                            Color.Transparent,
                                            SidebarTokens.Accent.copy(alpha = 0.25f)
                                        )
                                    )
                                )
                                .padding(1.5.dp)
                        )
                        Box(modifier = Modifier.padding(2.dp)) {
                            UserAvatar(
                                name = currentUser?.name ?: "User",
                                avatarUrl = currentUser?.avatar,
                                size = 30.dp,
                                borderColor = SidebarTokens.HairlineStrong
                            )
                        }
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .align(Alignment.BottomEnd)
                                .clip(CircleShape)
                                .background(SidebarTokens.SurfaceFooter)
                                .padding(2.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(CircleShape)
                                    .background(SidebarTokens.Online)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = currentUser?.name ?: "User",
                            color = SidebarTokens.TextBright,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "Online",
                            color = SidebarTokens.TextPrimary,
                            fontSize = 11.sp,
                            maxLines = 1
                        )
                    }
                }

                FooterIconButton(icon = Icons.Default.Mic, contentDescription = "Mute") { }
                FooterIconButton(icon = Icons.Default.Headset, contentDescription = "Deafen") { }
                FooterIconButton(icon = Icons.Default.Settings, contentDescription = "Settings", onClick = onSettingsClick)
            }
        }
    }
}

@Composable
private fun FooterIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    IconButton(
        onClick = onClick,
        interactionSource = interactionSource,
        modifier = Modifier
            .size(32.dp)
            .clip(CircleShape)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = SidebarTokens.TextPrimary,
            modifier = Modifier.size(18.dp)
        )
    }
}
