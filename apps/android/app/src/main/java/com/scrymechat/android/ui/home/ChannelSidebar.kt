package com.scrymechat.android.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.ui.components.UserAvatar
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceEntity

/**
 * Discord-style design tokens for the sidebar.
 *
 * Surfaces step up in small, low-contrast increments so elevation reads as
 * material rather than a sudden color jump — the same trick Discord, Slack,
 * and Linear all use for chrome that needs to disappear behind content.
 */
object SidebarTokens {
    val SurfaceBase = Color(0xFF2B2D31)      // channel list background
    val SurfaceRaised = Color(0xFF313338)    // header / raised chrome
    val SurfaceSelected = Color(0xFF3F4248)  // selected row fill
    val SurfacePressed = Color(0xFF35373C)   // hover/press fill
    val SurfaceFooter = Color(0xFF232428)    // member footer, sits "below" base

    val Hairline = Color(0x14FFFFFF)
    val HairlineStrong = Color(0x22FFFFFF)

    val Accent = Color(0xFF5865F2)           // Discord blurple, used sparingly
    val Online = Color(0xFF23A55A)
    val Danger = Color(0xFFED4245)

    val TextBright = Color(0xFFF2F3F5)       // selected / unread label
    val TextPrimary = Color(0xFFDBDEE1)      // default label
    val TextMuted = Color(0xFF949BA4)        // category labels, subtitles
    val TextFaint = Color(0xFF6D6F78)        // icon idle tint

    val PillIndicator = Color(0xFFF2F3F5)
}

/** Which glyph a channel row should show, independent of category chrome. */
private fun channelLeadingIcon(channel: ChannelEntity): Any {
    if (!channel.icon.isNullOrEmpty() && channel.icon != "#") return channel.icon
    return when (channel.type) {
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
            .width(248.dp)
            .fillMaxHeight()
            .background(SidebarTokens.SurfaceBase)
    ) {
        SidebarHeader(
            title = if (isHomeSelected) "Direct Messages" else (workspace?.name ?: ""),
            subtitle = null
        )

        HorizontalDivider(color = SidebarTokens.Hairline, thickness = 1.dp)

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 8.dp)
        ) {
            if (isHomeSelected) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    SidebarItem(
                        icon = Icons.Default.Person,
                        label = "Friends",
                        isSelected = false,
                        onClick = onFriendsClick
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }

                item {
                    SectionLabel(text = "Direct Messages", trailing = {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "New DM",
                            tint = SidebarTokens.TextMuted,
                            modifier = Modifier.size(16.dp)
                        )
                    })
                }

                items(dms, key = { it.dm.id }) { dmWithUser ->
                    val isDmSelected = selectedDm?.dm?.id == dmWithUser.dm.id
                    SidebarItem(
                        icon = Icons.Default.ChatBubble,
                        label = dmWithUser.otherUserName ?: "Unknown User",
                        isSelected = isDmSelected,
                        unreadCount = dmWithUser.dm.unreadCount,
                        onClick = { onDmClick(dmWithUser) }
                    )
                }

                item { Spacer(modifier = Modifier.height(12.dp)) }
            } else {
                val categories = channels.filter { it.parentId == null && it.type == "category" }
                val uncategorized = channels.filter { it.parentId == null && it.type != "category" }

                item { Spacer(modifier = Modifier.height(8.dp)) }

                items(uncategorized, key = { it.id }) { channel ->
                    ChannelItem(
                        channel = channel,
                        isSelected = selectedChannel?.id == channel.id,
                        onClick = { onChannelClick(channel) }
                    )
                }

                categories.forEach { category ->
                    val isExpanded = expandedCategories.contains(category.id)
                    val categoryChannels = channels.filter { it.parentId == category.id }
                    val hasUnread = categoryChannels.any { it.unreadCount > 0 }

                    item(key = "cat_${category.id}") {
                        CategoryHeader(
                            name = category.name,
                            isExpanded = isExpanded,
                            hasUnread = hasUnread && !isExpanded,
                            onToggle = { onCategoryToggle(category.id) },
                            onAddClick = onCreateChannelClick
                        )
                    }

                    if (isExpanded) {
                        items(categoryChannels, key = { it.id }) { channel ->
                            ChannelItem(
                                channel = channel,
                                isSelected = selectedChannel?.id == channel.id,
                                onClick = { onChannelClick(channel) }
                            )
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    CreateChannelRow(onClick = onCreateChannelClick)
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        }

        UserSection(currentUser = currentUser, onSettingsClick = onSettingsClick)
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
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) { }
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    color = SidebarTokens.TextBright,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (subtitle != null) {
                    Text(
                        text = subtitle,
                        color = SidebarTokens.TextMuted,
                        fontWeight = FontWeight.Medium,
                        fontSize = 11.sp
                    )
                }
            }
            Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = null,
                tint = SidebarTokens.TextMuted,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
private fun SectionLabel(text: String, trailing: (@Composable () -> Unit)? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 12.dp, end = 8.dp, top = 6.dp, bottom = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = text.uppercase(),
            color = SidebarTokens.TextMuted,
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
        animationSpec = tween(150),
        label = "categoryChevron"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(4.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = rememberRipple()
            ) { onToggle() }
            .padding(top = 16.dp, bottom = 4.dp, start = 4.dp, end = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.KeyboardArrowDown,
            contentDescription = null,
            tint = SidebarTokens.TextMuted,
            modifier = Modifier
                .size(14.dp)
                .rotate(rotation)
        )
        Spacer(modifier = Modifier.width(2.dp))
        Text(
            text = name.uppercase(),
            color = SidebarTokens.TextMuted,
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
            contentDescription = "Add Channel",
            tint = SidebarTokens.TextMuted,
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
            .clip(RoundedCornerShape(6.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = rememberRipple()
            ) { onClick() }
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = null,
            tint = SidebarTokens.TextFaint,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = "Create Channel",
            color = SidebarTokens.TextMuted,
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
 * Core list row used for channels, DMs, and static entries — the Discord
 * pattern: a small white pill in the gutter that's a dot when unread and
 * grows to fill the row when selected, paired with a soft fill and brighter
 * text/icon color. State is communicated redundantly on purpose so it reads
 * at a glance without relying on color alone.
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
        animationSpec = tween(150),
        label = "sidebarItemBackground"
    )
    val contentColor by animateColorAsState(
        targetValue = when {
            isSelected || isUnread -> SidebarTokens.TextBright
            else -> SidebarTokens.TextPrimary
        },
        animationSpec = tween(150),
        label = "sidebarItemContent"
    )
    val iconColor by animateColorAsState(
        targetValue = if (isSelected) SidebarTokens.TextBright else SidebarTokens.TextFaint,
        animationSpec = tween(150),
        label = "sidebarItemIcon"
    )
    val pillHeight by animateDpAsState(
        targetValue = when {
            isSelected -> 20.dp
            isUnread -> 8.dp
            else -> 0.dp
        },
        animationSpec = tween(150),
        label = "sidebarItemPill"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
    ) {
        // Pill indicator lives in the 8dp gutter to the left of the row,
        // outside the row's own clipped/rounded surface.
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .offset(x = (-8).dp)
                .width(4.dp)
                .height(pillHeight)
                .clip(RoundedCornerShape(topEnd = 4.dp, bottomEnd = 4.dp))
                .background(SidebarTokens.PillIndicator)
        )

        Surface(
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(6.dp))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = rememberRipple(color = SidebarTokens.Accent)
                ) { onClick() },
            color = backgroundColor
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = 10.dp, end = 8.dp)
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
                        fontSize = 16.sp,
                        modifier = Modifier.size(18.dp),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                    else -> Spacer(modifier = Modifier.size(18.dp))
                }

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = label,
                    color = contentColor,
                    fontSize = 15.sp,
                    fontWeight = if (isSelected || isUnread) FontWeight.SemiBold else FontWeight.Normal,
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
                            .padding(horizontal = 5.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (unreadCount > 99) "99+" else unreadCount.toString(),
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
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
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(6.dp))
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = rememberRipple()
                        ) { onSettingsClick() }
                        .padding(horizontal = 6.dp),
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
                                .size(13.dp)
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
                            color = SidebarTokens.TextMuted,
                            fontSize = 11.sp,
                            maxLines = 1
                        )
                    }
                }

                FooterIconButton(icon = Icons.Default.Mic, contentDescription = "Mute") { /* Mute */ }
                FooterIconButton(icon = Icons.Default.Headset, contentDescription = "Deafen") { /* Deafen */ }
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
    IconButton(onClick = onClick, modifier = Modifier.size(28.dp)) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = SidebarTokens.TextMuted,
            modifier = Modifier.size(17.dp)
        )
    }
}
