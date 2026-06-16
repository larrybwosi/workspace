package com.scrymechat.android.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceEntity
import com.scrymechat.android.ui.theme.*

@Composable
fun ChannelSidebar(
    workspace: WorkspaceEntity?,
    channels: List<ChannelEntity>,
    selectedChannel: ChannelEntity?,
    isHomeSelected: Boolean,
    currentUser: UserEntity?,
    expandedCategories: Set<String>,
    onChannelClick: (ChannelEntity) -> Unit,
    onCategoryToggle: (String) -> Unit,
    onSettingsClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(240.dp)
            .fillMaxHeight()
            .background(ScrymeDarkSurface)
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .padding(horizontal = 16.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(
                text = if (isHomeSelected) "Direct Messages" else (workspace?.name ?: ""),
                color = ScrymeDarkTextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        }

        Divider(color = ScrymeDarkBackground, thickness = 1.dp)

        // Channel/DM List
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 8.dp)
        ) {
            if (isHomeSelected) {
                item {
                    SidebarItem(
                        icon = Icons.Default.Person,
                        label = "Friends",
                        isSelected = false, // Placeholder
                        onClick = {}
                    )
                }
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "DIRECT MESSAGES",
                        color = ScrymeDarkTextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                // DMs placeholders or real DMs if available
            } else {
                val categories = channels.filter { it.parentId == null && it.type == "category" }
                val uncategorized = channels.filter { it.parentId == null && it.type != "category" }

                items(uncategorized) { channel ->
                    ChannelItem(
                        channel = channel,
                        isSelected = selectedChannel?.id == channel.id,
                        onClick = { onChannelClick(channel) }
                    )
                }

                categories.forEach { category ->
                    val isExpanded = expandedCategories.contains(category.id)
                    item {
                        CategoryHeader(
                            name = category.name,
                            isExpanded = isExpanded,
                            onToggle = { onCategoryToggle(category.id) }
                        )
                    }
                    if (isExpanded) {
                        val categoryChannels = channels.filter { it.parentId == category.id }
                        items(categoryChannels) { channel ->
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

        // User Section
        UserSection(currentUser = currentUser, onSettingsClick = onSettingsClick)
    }
}

@Composable
fun CategoryHeader(
    name: String,
    isExpanded: Boolean,
    onToggle: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 16.dp, bottom = 4.dp)
            .clickable { onToggle() },
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (isExpanded) Icons.Default.KeyboardArrowDown else Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = ScrymeDarkTextSecondary,
            modifier = Modifier.size(12.dp)
        )
        Text(
            text = name.uppercase(),
            color = ScrymeDarkTextSecondary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 4.dp)
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

@Composable
fun SidebarItem(
    icon: ImageVector,
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
            .clip(RoundedCornerShape(4.dp))
            .clickable { onClick() },
        color = if (isSelected) ScrymeDarkSurfaceVariant else Color.Transparent
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) ScrymeDarkTextPrimary else ScrymeDarkTextSecondary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = label,
                color = if (isSelected) ScrymeDarkTextPrimary else ScrymeDarkTextSecondary,
                fontSize = 14.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
            )
        }
    }
}

@Composable
fun UserSection(
    currentUser: UserEntity?,
    onSettingsClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        color = Color(0xFF0A0A0A) // Slightly darker than surface for user section
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Box(modifier = Modifier.size(32.dp)) {
                if (currentUser?.avatar != null) {
                    AsyncImage(
                        model = currentUser.avatar,
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(Color.Gray)
                    )
                }
                // Status Indicator
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF0A0A0A))
                        .padding(2.dp)
                        .align(Alignment.BottomEnd)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(Color(0xFF23A559)) // Online Green
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Name & Tag
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = currentUser?.name ?: "User",
                    color = ScrymeDarkTextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1
                )
                Text(
                    text = "Online",
                    color = ScrymeDarkTextSecondary,
                    fontSize = 11.sp,
                    maxLines = 1
                )
            }

            // Quick Actions
            IconButton(onClick = { /* Mute */ }, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Default.Mic, contentDescription = "Mute", tint = ScrymeDarkTextSecondary, modifier = Modifier.size(20.dp))
            }
            IconButton(onClick = { /* Deafen */ }, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Default.Headset, contentDescription = "Deafen", tint = ScrymeDarkTextSecondary, modifier = Modifier.size(20.dp))
            }
            IconButton(onClick = onSettingsClick, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Default.Settings, contentDescription = "Settings", tint = ScrymeDarkTextSecondary, modifier = Modifier.size(20.dp))
            }
        }
    }
}
