package com.scrymechat.android.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
 * Exact Discord design tokens for dark themes.
 */
object SidebarTokens {
    val SurfaceBase = Color(0xFF2B2D31)       // Channel list container
    val SurfaceRaised = Color(0xFF313338)     // Header / Raised chrome
    val SurfaceSelected = Color(0xFF35373C)   // Active channel row
    val SurfaceHover = Color(0xFF313338)      // Hover/Pressed state
    val SurfaceFooter = Color(0xFF232428)     // User bar at the bottom

    val Hairline = Color(0x1F000000)
    val HairlineStrong = Color(0x22FFFFFF)

    val Accent = Color(0xFF5865F2)            // Blurple
    val Online = Color(0xFF23A55A)            // Status Green
    val Danger = Color(0xFFF23F43)            // Notification Badge Red

    val TextBright = Color(0xFFFFFFFF)        // Selected / Unread label
    val TextPrimary = Color(0xFF949BA4)       // Normal channel color
    val TextCategory = Color(0xFF949BA4)      // Category titles
    val TextMuted = Color(0xFF949BA4)
    val TextFaint = Color(0xFF80848E)         // Channel icons idle tint

    val PillIndicator = Color(0xFFFFFFFF)
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
                            isSelected = false,
                            onClick = onFriendsClick
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }

                item {
                    SectionLabel(text = "Direct Messages", trailing = {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "New DM",
                            tint = SidebarTokens.TextPrimary,
                            modifier = Modifier
                                .size(16.dp)
                                .clip(CircleShape)
                                .clickable { /* Create DM */ }
                        )
                    })
                }

                items(dms, key = { it.dm.id }) { dmWithUser ->
                    val isDmSelected = selectedDm?.dm?.id == dmWithUser.dm.id
                    PaddingWrapper {
                        SidebarItem(
                            icon = Icons.Default.ChatBubble,
                            label = dmWithUser.otherUserName ?: "Unknown User",
                            isSelected = isDmSelected,
                            unreadCount = dmWithUser.dm.unreadCount,
                            onClick = { onDmClick(dmWithUser) }
                        )
                    }
                }
            } else {
                // Workspace / Server Channels View
                val (uncategorized, groupedCategories) = processChannelGrouping(channels)

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
                            enter = expandVertically() + fadeIn(),
                            exit = shrinkVertically() + fadeOut()
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
        color = SidebarTokens.SurfaceRaised
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .clickable { }
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
            Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = "Server Menu",
                tint = SidebarTokens.TextBright,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun SectionLabel(text: String, trailing: (@Composable () -> Unit)? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 16.dp, end = 12.dp, top = 12.dp, bottom = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = text.uppercase(),
            color = SidebarTokens.TextCategory,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.2.sp
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
        animationSpec = tween(150),
        label = "chevronRotation"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) { onToggle() }
            .padding(start = 8.dp, end = 12.dp, top = 12.dp, bottom = 4.dp),
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
            letterSpacing = 0.2.sp,
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
            .height(32.dp)
            .clip(RoundedCornerShape(4.dp))
            .clickable { onClick() }
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = null,
            tint = SidebarTokens.TextFaint,
            modifier = Modifier.size(16.dp)
        )
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
 * Core list item with the iconic Discord pill indicator on the left edge.
 */
@Composable
fun SidebarItem(
    icon: Any?,
    label: String,
    isSelected: Boolean,
    unreadCount: Int = 0,
    onClick: () -> Unit
) {
    val isUnread = unreadCount > 0 && !isSelected

    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) SidebarTokens.SurfaceSelected else Color.Transparent,
        animationSpec = tween(100),
        label = "itemBg"
    )
    val contentColor by animateColorAsState(
        targetValue = when {
            isSelected || isUnread -> SidebarTokens.TextBright
            else -> SidebarTokens.TextPrimary
        },
        animationSpec = tween(100),
        label = "itemText"
    )
    val iconColor by animateColorAsState(
        targetValue = when {
            isSelected || isUnread -> SidebarTokens.TextBright
            else -> SidebarTokens.TextFaint
        },
        animationSpec = tween(100),
        label = "itemIcon"
    )
    val pillHeight by animateDpAsState(
        targetValue = when {
            isSelected -> 20.dp
            isUnread -> 8.dp
            else -> 0.dp
        },
        animationSpec = tween(150),
        label = "itemPill"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
    ) {
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
                .clip(RoundedCornerShape(4.dp))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
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
                when (icon) {
                    is ImageVector -> Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconColor,
                        modifier = Modifier.size(18.dp)
                    )
                    is String -> Text(
                        text = icon,
                        color = iconColor,
                        fontSize = 16.sp,
                        modifier = Modifier.size(18.dp),
                        textAlign = TextAlign.Center
                    )
                    else -> Spacer(modifier = Modifier.size(18.dp))
                }

                Spacer(modifier = Modifier.width(8.dp))

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
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            color = SidebarTokens.SurfaceFooter
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(4.dp))
                        .clickable { onSettingsClick() }
                        .padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(32.dp)) {
                        UserAvatar(
                            name = currentUser?.name ?: "User",
                            avatarUrl = currentUser?.avatar,
                            size = 32.dp,
                            borderColor = SidebarTokens.HairlineStrong
                        )
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
    IconButton(
        onClick = onClick,
        modifier = Modifier.size(32.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = SidebarTokens.TextPrimary,
            modifier = Modifier.size(18.dp)
        )
    }
}
