package com.scrymechat.android.ui.home

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.local.entities.DmConversationEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceEntity
import com.scrymechat.android.ui.theme.*

/**
 * Enterprise-grade design tokens for the sidebar.
 *
 * These layer on top of the existing Scryme*** theme colors rather than
 * replacing them, so the rest of the app is unaffected. Centralizing them
 * here makes the "premium" intent legible and easy to re-tune in one place.
 */
object SidebarTokens {
    // Surfaces — restrained, low-contrast steps so elevation reads as
    // material rather than as a sudden color jump.
    val SurfaceBase = Color(0xFF18191D)
    val SurfaceRaised = Color(0xFF1F2024)
    val SurfaceSelected = Color(0xFF262830)
    val SurfaceFooter = Color(0xFF111216)

    // Hairlines instead of flat block dividers — reads as a seam, not a wall.
    val Hairline = Color(0x14FFFFFF)
    val HairlineStrong = Color(0x22FFFFFF)

    // Single restrained brand accent used sparingly: selection rail, focus,
    // presence ring highlight. Everything else stays neutral.
    val Accent = Color(0xFF6C8DFF)
    val AccentMuted = Color(0x296C8DFF)

    val Online = Color(0xFF34C77B)

    val TextPrimary = Color(0xFFEDEEF1)
    val TextSecondary = Color(0xFF8E909C)
    val TextTertiary = Color(0xFF6B6D78)
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
    onChannelClick: (ChannelEntity) -> Unit,
    onDmClick: (DmConversationEntity) -> Unit = {},
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
            subtitle = if (isHomeSelected) null else "Workspace"
        )

        HorizontalDivider(color = SidebarTokens.Hairline, thickness = 1.dp)

        // Channel/DM List
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 8.dp, vertical = 8.dp)
        ) {
            if (isHomeSelected) {
                item {
                    SidebarItem(
                        icon = Icons.Default.Person,
                        label = "Friends",
                        isSelected = false,
                        onClick = onFriendsClick
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    SectionLabel(text = "Direct Messages")
                }

                items(dms, key = { it.dm.id }) { dmWithUser ->
                    SidebarItem(
                        icon = Icons.Default.ChatBubble,
                        label = dmWithUser.otherUserName ?: "Unknown User",
                        isSelected = false,
                        onClick = { onDmClick(dmWithUser.dm) }
                    )
                }
            } else {
                val categories = channels.filter { it.parentId == null && it.type == "category" }
                val uncategorized = channels.filter { it.parentId == null && it.type != "category" }

                items(uncategorized, key = { it.id }) { channel ->
                    ChannelItem(
                        channel = channel,
                        isSelected = selectedChannel?.id == channel.id,
                        onClick = { onChannelClick(channel) }
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onCreateChannelClick,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SidebarTokens.SurfaceRaised),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp), tint = SidebarTokens.Accent)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Create Channel", color = SidebarTokens.TextPrimary, fontSize = 13.sp)
                    }
                }

                categories.forEach { category ->
                    val isExpanded = expandedCategories.contains(category.id)
                    item(key = "cat_${category.id}") {
                        CategoryHeader(
                            name = category.name,
                            isExpanded = isExpanded,
                            onToggle = { onCategoryToggle(category.id) },
                            onAddClick = onCreateChannelClick
                        )
                    }
                    if (isExpanded) {
                        val categoryChannels = channels.filter { it.parentId == category.id }
                        items(categoryChannels, key = { it.id }) { channel ->
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

        UserSection(currentUser = currentUser, onSettingsClick = onSettingsClick)
    }
}

@Composable
private fun SidebarHeader(title: String, subtitle: String?) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .padding(horizontal = 16.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        Column {
            Text(
                text = title,
                color = SidebarTokens.TextPrimary,
                fontWeight = FontWeight.SemiBold,
                fontSize = 15.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    color = SidebarTokens.TextTertiary,
                    fontWeight = FontWeight.Medium,
                    fontSize = 11.sp,
                    letterSpacing = 0.2.sp
                )
            }
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text.uppercase(),
        color = SidebarTokens.TextTertiary,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.6.sp,
        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
    )
}

@Composable
fun CategoryHeader(
    name: String,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    onAddClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(6.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) { onToggle() }
            .padding(top = 18.dp, bottom = 6.dp, start = 4.dp, end = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (isExpanded) Icons.Default.KeyboardArrowDown else Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = SidebarTokens.TextTertiary,
            modifier = Modifier.size(14.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = name.uppercase(),
            color = SidebarTokens.TextTertiary,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.6.sp,
            modifier = Modifier.weight(1f)
        )
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = "Add Channel",
            tint = SidebarTokens.TextTertiary,
            modifier = Modifier
                .size(16.dp)
                .clickable { onAddClick() }
        )
    }
}

@Composable
fun ChannelItem(
    channel: ChannelEntity,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val icon = when (channel.type) {
        "voice" -> Icons.AutoMirrored.Filled.VolumeUp
        else -> Icons.Default.Tag
    }
    SidebarItem(
        icon = icon,
        label = channel.name,
        isSelected = isSelected,
        onClick = onClick
    )
}

/**
 * Core list row used for channels, DMs, and static entries.
 *
 * Selection is communicated two ways at once — a soft fill and a thin
 * accent rail on the leading edge — which is the pattern enterprise tools
 * (Linear, Slack, Notion) converge on because it reads instantly even at a
 * glance, and it animates smoothly between states instead of snapping.
 */
@Composable
fun SidebarItem(
    icon: ImageVector,
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) SidebarTokens.SurfaceSelected else Color.Transparent,
        animationSpec = tween(150),
        label = "sidebarItemBackground"
    )
    val contentColor by animateColorAsState(
        targetValue = if (isSelected) SidebarTokens.TextPrimary else SidebarTokens.TextSecondary,
        animationSpec = tween(150),
        label = "sidebarItemContent"
    )
    val railWidth by animateFloatAsState(
        targetValue = if (isSelected) 3f else 0f,
        animationSpec = tween(150),
        label = "sidebarItemRail"
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(36.dp)
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
                .drawBehind {
                    if (railWidth > 0f) {
                        drawRoundRect(
                            color = SidebarTokens.Accent,
                            topLeft = Offset(0f, size.height * 0.22f),
                            size = androidx.compose.ui.geometry.Size(railWidth.dp.toPx(), size.height * 0.56f),
                            cornerRadius = CornerRadius(2.dp.toPx())
                        )
                    }
                }
                .padding(start = 12.dp, end = 10.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) SidebarTokens.Accent else SidebarTokens.TextTertiary,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = label,
                color = contentColor,
                fontSize = 14.sp,
                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
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
                .height(56.dp),
            color = SidebarTokens.SurfaceFooter
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar with a subtle ring and a presence dot cut cleanly
                // into the footer background (not a flat circle on top).
                Box(modifier = Modifier.size(34.dp)) {
                    if (currentUser?.avatar != null) {
                        AsyncImage(
                            model = currentUser.avatar,
                            contentDescription = null,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .border(BorderStroke(1.dp, SidebarTokens.HairlineStrong), CircleShape)
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .background(SidebarTokens.SurfaceRaised)
                                .border(BorderStroke(1.dp, SidebarTokens.HairlineStrong), CircleShape)
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(13.dp)
                            .align(Alignment.BottomEnd)
                            .clip(CircleShape)
                            .background(SidebarTokens.SurfaceFooter)
                            .padding(2.5.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .background(SidebarTokens.Online)
                        )
                    }
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = currentUser?.name ?: "User",
                        color = SidebarTokens.TextPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "Online",
                        color = SidebarTokens.TextTertiary,
                        fontSize = 11.sp,
                        maxLines = 1
                    )
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
    IconButton(onClick = onClick, modifier = Modifier.size(30.dp)) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = SidebarTokens.TextTertiary,
            modifier = Modifier.size(17.dp)
        )
    }
}
