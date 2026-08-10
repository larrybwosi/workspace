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
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.scrymechat.android.ui.theme.LocalThemeIsDark
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceEntity
import com.scrymechat.android.ui.components.UserAvatar

/**
 * Premium/enterprise design tokens.
 *
 * The palette moves away from flat Discord grey toward a slightly cooler,
 * deeper "graphite" base with an indigo-violet accent gradient instead of a
 * single flat blurple — this is what reads as "premium SaaS" rather than
 * "consumer chat app default theme". Elevation is expressed with real
 * (if subtle) shadows instead of only flat color swaps, and hairlines carry
 * a faint gradient fade rather than a uniform 1dp line.
 */
object SidebarTokens {
    // Slightly cooler & deeper than stock Discord — reads less "flat grey box".
    val SurfaceBase: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFF1C1D22) else Color(0xFFF5F6F8)
    val SurfaceRaised: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFF24252B) else Color(0xFFFFFFFF)
    val SurfaceSelected: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFF2E3038) else Color(0xFFEDEFF5)
    val SurfaceHover: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFF26272E) else Color(0xFFF0F1F5)
    val SurfaceFooter: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFF17181C) else Color(0xFFEDEFF5)
    val SurfaceIconIdle: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFF1B1C21) else Color(0xFFE7E9F0)

    val Hairline: Color @Composable get() = if (LocalThemeIsDark.current) Color(0x2EFFFFFF) else Color(0x14000000)
    val HairlineStrong: Color @Composable get() = if (LocalThemeIsDark.current) Color(0x3DFFFFFF) else Color(0x1F000000)

    // Indigo-violet gradient accent instead of a flat single blurple.
    val AccentStart = Color(0xFF6D5EF5)
    val AccentEnd = Color(0xFF8B5CF6)
    val Accent = Color(0xFF6D5EF5)
    val AccentGradient: Brush @Composable get() = Brush.linearGradient(listOf(AccentStart, AccentEnd))
    val AccentSoft: Color @Composable get() = if (LocalThemeIsDark.current) Color(0x336D5EF5) else Color(0x1F6D5EF5)

    val Online = Color(0xFF3BC46A)
    val Danger = Color(0xFFFF4D5E)
    val Premium = Color(0xFFF5B93B) // small "enterprise/verified" accent, used sparingly

    val TextBright: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFFFFFFFF) else Color(0xFF0B0C10)
    val TextPrimary: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFFAEB2C4) else Color(0xFF474A57)
    val TextCategory: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFF7C8098) else Color(0xFF6A6D7C)
    val TextMuted: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFF8B8FA3) else Color(0xFF5C5E66)
    val TextFaint: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xFF6E7186) else Color(0xFF7A7D8A)

    val PillGradient: Brush @Composable get() = AccentGradient

    val HeaderGradient: Brush @Composable get() {
        val dark = LocalThemeIsDark.current
        return Brush.verticalGradient(
            colors = if (dark) listOf(Color(0xFF26272F), Color(0xFF1D1E24)) else listOf(Color(0xFFFFFFFF), Color(0xFFF5F6F8))
        )
    }
    val FooterGradient: Brush @Composable get() {
        val dark = LocalThemeIsDark.current
        return Brush.verticalGradient(
            colors = if (dark) listOf(Color(0xFF1A1B20), Color(0xFF141519)) else listOf(Color(0xFFF5F6F8), Color(0xFFE7E9F0))
        )
    }
    // Faint top-to-bottom fade so hairlines don't read as harsh ruled lines.
    val HairlineFade: Brush @Composable get() = Brush.horizontalGradient(
        listOf(Color.Transparent, Hairline, Hairline, Color.Transparent)
    )

    val ShadowColor: Color @Composable get() = if (LocalThemeIsDark.current) Color(0xCC000000) else Color(0x1F1B1D2A)
}

fun presenceColor(status: String?): Color = when (status?.lowercase()) {
    "online" -> Color(0xFF3BC46A)
    "idle", "away" -> Color(0xFFF2A93B)
    "dnd", "busy" -> Color(0xFFFF4D5E)
    else -> Color(0xFF6C7086)
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
    val (uncategorized, groupedCategories) = remember(channels) {
        processChannelGrouping(channels)
    }

    LaunchedEffect(groupedCategories) {
        groupedCategories.forEach { category ->
            if (category.categoryId !in expandedCategories) {
                onCategoryToggle(category.categoryId)
            }
        }
    }

    Column(
        modifier = Modifier
            .width(280.dp)
            .fillMaxHeight()
            .background(SidebarTokens.SurfaceBase)
    ) {
        // --- 1. Top Header ---
        if (isHomeSelected) {
            SidebarHeader(
                title = "Direct Messages",
                subtitle = null
            )
        } else {
            WorkspaceBanner(workspace = workspace)
        }

        HorizontalDivider(color = SidebarTokens.Hairline, thickness = 1.dp)

        // --- 2. Main Content List ---
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            if (isHomeSelected) {
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

/**
 * Workspace banner — swapped the old hash-based random gradient for the
 * consistent brand accent gradient plus a subtle vignette. Adds a small
 * verified/enterprise badge next to the name and a member-count style
 * caption slot, which is what separates "chat app header" from "workspace
 * dashboard header".
 */
@Composable
fun WorkspaceBanner(workspace: WorkspaceEntity?) {
    if (workspace == null) return

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(112.dp)
            .background(SidebarTokens.AccentGradient)
    ) {
        if (workspace.icon != null && workspace.icon.startsWith("http")) {
            AsyncImage(
                model = workspace.icon,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
                alpha = 0.32f
            )
        }

        // Vignette for legibility, darker and tighter than before for a
        // more "designed" look rather than a flat linear fade.
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0f to Color.Black.copy(alpha = 0.05f),
                        0.55f to Color.Black.copy(alpha = 0.35f),
                        1f to Color.Black.copy(alpha = 0.82f)
                    )
                )
        )

        // Faint top sheen — a 1px highlight along the very top edge.
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(Color.White.copy(alpha = 0.18f))
                .align(Alignment.TopCenter)
        )

        Row(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(14.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = workspace.name,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.Verified,
                        contentDescription = "Verified workspace",
                        tint = SidebarTokens.Premium,
                        modifier = Modifier.size(14.dp)
                    )
                }
                if (!workspace.description.isNullOrBlank()) {
                    Text(
                        text = workspace.description,
                        color = Color.White.copy(alpha = 0.72f),
                        fontSize = 11.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Box(
                modifier = Modifier
                    .size(26.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.14f))
                    .border(1.dp, Color.White.copy(alpha = 0.18f), CircleShape)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = rememberRipple(bounded = false, radius = 16.dp)
                    ) { },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = "Workspace menu",
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
private fun SidebarHeader(title: String, subtitle: String?) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(SidebarTokens.HeaderGradient)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
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
                    fontSize = 16.sp,
                    letterSpacing = (-0.2).sp,
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
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(SidebarTokens.SurfaceIconIdle)
                    .border(1.dp, SidebarTokens.HairlineStrong, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = "Menu",
                    tint = SidebarTokens.TextBright,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(SidebarTokens.HairlineFade)
                .align(Alignment.BottomCenter)
        )
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
            fontSize = 11.5.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.6.sp
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
            fontSize = 11.5.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.6.sp,
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
                .background(SidebarTokens.SurfaceIconIdle)
                .border(1.dp, SidebarTokens.Hairline, RoundedCornerShape(6.dp)),
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
 * Core list item. Selected state now uses:
 *  - a real (small, tasteful) drop shadow on the row card instead of a flat
 *    color swap, giving it a "lifted" enterprise-panel feel;
 *  - a gradient pill indicator instead of a flat white bar;
 *  - a soft radial glow that sits behind the pill for a bit of depth.
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
        targetValue = if (isSelected) SidebarTokens.Accent.copy(alpha = 0.20f) else SidebarTokens.SurfaceIconIdle,
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
    val elevation by animateDpAsState(
        targetValue = if (isSelected) 3.dp else 0.dp,
        animationSpec = tween(150),
        label = "itemElevation"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
            .scale(scale)
    ) {
        if (isSelected) {
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .offset(x = (-10).dp)
                    .size(width = 12.dp, height = 28.dp)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(SidebarTokens.AccentSoft, Color.Transparent)
                        )
                    )
            )
        }

        // Gradient pill indicator (left edge gutter)
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .offset(x = (-8).dp)
                .width(4.dp)
                .height(pillHeight)
                .clip(RoundedCornerShape(topEnd = 4.dp, bottomEnd = 4.dp))
                .background(SidebarTokens.PillGradient)
        )

        Surface(
            modifier = Modifier
                .fillMaxSize()
                .shadow(
                    elevation = elevation,
                    shape = RoundedCornerShape(6.dp),
                    ambientColor = SidebarTokens.ShadowColor,
                    spotColor = SidebarTokens.ShadowColor
                )
                .clip(RoundedCornerShape(6.dp))
                .clickable(
                    interactionSource = interactionSource,
                    indication = rememberRipple(color = SidebarTokens.SurfaceHover)
                ) { onClick() },
            color = backgroundColor,
            border = if (isSelected) BorderStroke(1.dp, SidebarTokens.HairlineStrong) else null
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
                    letterSpacing = (-0.1).sp,
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

/**
 * Footer — the avatar now sits on a gradient ring rather than a sweep
 * gradient, a slightly larger touch target, and the presence label has
 * been promoted to a small pill so it reads as a status chip rather than
 * plain caption text, which is a very "enterprise dashboard" affordance.
 */
@Composable
fun UserSection(
    currentUser: UserEntity?,
    onSettingsClick: () -> Unit
) {
    Column {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(SidebarTokens.HairlineFade)
        )
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
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
                        .clip(RoundedCornerShape(8.dp))
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = rememberRipple(color = SidebarTokens.SurfaceHover)
                        ) { onSettingsClick() }
                        .padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(36.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .background(SidebarTokens.AccentGradient)
                                .padding(2.dp)
                        )
                        Box(modifier = Modifier.padding(2.5.dp)) {
                            UserAvatar(
                                name = currentUser?.name ?: "User",
                                avatarUrl = currentUser?.avatar,
                                size = 31.dp,
                                borderColor = SidebarTokens.SurfaceFooter
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

                    Spacer(modifier = Modifier.width(9.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = currentUser?.name ?: "User",
                            color = SidebarTokens.TextBright,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = (-0.1).sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(SidebarTokens.Online)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Online",
                                color = SidebarTokens.TextPrimary,
                                fontSize = 11.sp,
                                maxLines = 1
                            )
                        }
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
            .background(SidebarTokens.SurfaceIconIdle)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = SidebarTokens.TextPrimary,
            modifier = Modifier.size(16.dp)
        )
    }
}
