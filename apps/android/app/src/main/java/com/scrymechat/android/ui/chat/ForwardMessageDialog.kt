package com.scrymechat.android.ui.chat

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Tag
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.SearchOff
import androidx.compose.material.ripple.rememberRipple
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.local.entities.MessageEntity
import com.scrymechat.android.ui.theme.ScrymeDarkSurface
import com.scrymechat.android.ui.theme.ScrymeDarkTextPrimary
import com.scrymechat.android.ui.theme.ScrymeDarkTextSecondary

/**
 * Forward-to-channel dialog.
 *
 * UX notes:
 * - A search field appears once the channel list is long enough that scanning
 *   becomes slower than typing (>8 channels). Below that threshold it stays
 *   hidden to avoid cluttering a short, already-scannable list.
 * - Selecting a channel gives immediate visual confirmation (checkmark + tinted
 *   row) before the sheet closes, so the action never feels like it silently fired.
 * - Row backgrounds and icon chips use a consistent accent color per channel type
 *   (text vs. voice) so the list reads at a glance without leaning on labels.
 */
@Composable
fun ForwardMessageDialog(
    message: MessageEntity,
    channels: List<ChannelEntity>,
    onForward: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var query by rememberSaveable { mutableStateOf("") }
    var selectedChannelId by rememberSaveable { mutableStateOf<String?>(null) }

    val filteredChannels = remember(channels, query) {
        if (query.isBlank()) {
            channels
        } else {
            channels.filter { it.name.contains(query, ignoreCase = true) }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = ScrymeDarkSurface,
        shape = RoundedCornerShape(20.dp),
        title = {
            Column {
                Text(
                    text = "Forward Message",
                    color = ScrymeDarkTextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Text(
                    text = "Choose a channel to share this with",
                    color = ScrymeDarkTextSecondary,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        },
        text = {
            Column {
                if (channels.size > 8) {
                    OutlinedTextField(
                        value = query,
                        onValueChange = { query = it },
                        placeholder = { Text("Search channels", fontSize = 14.sp) },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Outlined.Search,
                                contentDescription = null,
                                tint = ScrymeDarkTextSecondary
                            )
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = ScrymeDarkTextPrimary,
                            unfocusedTextColor = ScrymeDarkTextPrimary,
                            cursorColor = MaterialTheme.colorScheme.primary,
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = ScrymeDarkTextSecondary.copy(alpha = 0.3f)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                    )
                }

                if (filteredChannels.isEmpty()) {
                    EmptyChannelState()
                } else {
                    LazyColumn(
                        modifier = Modifier.heightIn(max = 320.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        items(filteredChannels, key = { it.id }) { channel ->
                            ChannelRow(
                                channel = channel,
                                isSelected = channel.id == selectedChannelId,
                                onClick = {
                                    selectedChannelId = channel.id
                                    onForward(channel.id)
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(
                    text = "Cancel",
                    color = ScrymeDarkTextSecondary,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    )
}

@Composable
private fun ChannelRow(
    channel: ChannelEntity,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val isVoice = channel.type == "voice"

    val rowBackground = when {
        isSelected -> MaterialTheme.colorScheme.primary.copy(alpha = 0.14f)
        isPressed -> ScrymeDarkTextSecondary.copy(alpha = 0.08f)
        else -> androidx.compose.ui.graphics.Color.Transparent
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(rowBackground)
            .clickable(
                interactionSource = interactionSource,
                indication = rememberRipple(),
                onClick = onClick
            )
            .padding(vertical = 10.dp, horizontal = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(
                    if (isVoice) {
                        MaterialTheme.colorScheme.tertiary.copy(alpha = 0.16f)
                    } else {
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.16f)
                    }
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (isVoice) Icons.Default.Chat else Icons.Default.Tag,
                contentDescription = if (isVoice) "Voice channel" else "Text channel",
                tint = if (isVoice) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(16.dp)
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Text(
            text = channel.name,
            color = ScrymeDarkTextPrimary,
            fontSize = 15.sp,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
            modifier = Modifier.weight(1f)
        )

        AnimatedVisibility(visible = isSelected) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = "Selected",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun EmptyChannelState() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Outlined.SearchOff,
            contentDescription = null,
            tint = ScrymeDarkTextSecondary,
            modifier = Modifier.size(28.dp)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "No channels match your search",
            color = ScrymeDarkTextSecondary,
            fontSize = 13.sp
        )
    }
}
