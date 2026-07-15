package com.scrymechat.android.ui.home

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.scrymechat.android.data.remote.CreateChannelRequest

/**
 * A channel's chosen icon: either one of the built-in Discord-style presets
 * (glyph + tint) or a user-supplied image.
 */
sealed class ChannelIconSelection {
    data class Preset(val icon: ImageVector, val color: Color, val label: String) : ChannelIconSelection()
    data class Custom(val uri: Uri) : ChannelIconSelection()
}

/** Discord-style preset channel icons: a glyph paired with a brand-ish tint. */
val PRESET_CHANNEL_ICONS = listOf(
    ChannelIconSelection.Preset(Icons.Rounded.Tag, Color(0xFF5865F2), "General"),
    ChannelIconSelection.Preset(Icons.Rounded.Forum, Color(0xFF57F287), "Discussion"),
    ChannelIconSelection.Preset(Icons.Rounded.Campaign, Color(0xFFFEE75C), "Announcements"),
    ChannelIconSelection.Preset(Icons.Rounded.SportsEsports, Color(0xFFEB459E), "Gaming"),
    ChannelIconSelection.Preset(Icons.Rounded.MusicNote, Color(0xFF9B59B6), "Music"),
    ChannelIconSelection.Preset(Icons.Rounded.Code, Color(0xFF3BA55D), "Dev"),
    ChannelIconSelection.Preset(Icons.Rounded.Palette, Color(0xFFED4245), "Art"),
    ChannelIconSelection.Preset(Icons.Rounded.MenuBook, Color(0xFF1ABC9C), "Study"),
    ChannelIconSelection.Preset(Icons.Rounded.Videocam, Color(0xFF5865F2), "Video"),
    ChannelIconSelection.Preset(Icons.Rounded.Mic, Color(0xFFF47B67), "Voice"),
    ChannelIconSelection.Preset(Icons.Rounded.Star, Color(0xFFFAA61A), "Favorites"),
    ChannelIconSelection.Preset(Icons.Rounded.Groups, Color(0xFF747F8D), "Community"),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateChannelDialog(
    isLoading: Boolean = false,
    onDismiss: () -> Unit,
    onCreate: (CreateChannelRequest, ChannelIconSelection) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("public") }
    var selectedIcon by remember { mutableStateOf<ChannelIconSelection>(PRESET_CHANNEL_ICONS.first()) }
    var showIconPicker by remember { mutableStateOf(false) }
    var dropdownExpanded by remember { mutableStateOf(false) }

    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = SidebarTokens.Accent,
        focusedLabelColor = SidebarTokens.Accent,
        unfocusedLabelColor = SidebarTokens.TextMuted,
        cursorColor = SidebarTokens.Accent,
        unfocusedTextColor = SidebarTokens.TextBright,
        focusedTextColor = SidebarTokens.TextBright,
        unfocusedBorderColor = SidebarTokens.HairlineStrong,
        unfocusedPlaceholderColor = SidebarTokens.TextFaint,
        focusedPlaceholderColor = SidebarTokens.TextFaint
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            shape = RoundedCornerShape(16.dp),
            color = SidebarTokens.SurfaceRaised
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Create Channel",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Bold,
                        color = SidebarTokens.TextBright
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = Icons.Rounded.Close,
                            contentDescription = "Close",
                            tint = SidebarTokens.TextMuted,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                // Channel icon — tap the avatar to open the preset/custom picker.
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ChannelIconAvatar(
                        selection = selectedIcon,
                        size = 56.dp,
                        onClick = { showIconPicker = true }
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            "Channel Icon",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = SidebarTokens.TextBright
                        )
                        Text(
                            "Tap to choose a preset or upload your own",
                            fontSize = 11.sp,
                            color = SidebarTokens.TextMuted
                        )
                    }
                }

                // Channel Type Dropdown Menu Selection
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = if (type == "public") "Public Channel" else "Private Channel",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Channel Type") },
                        leadingIcon = {
                            Icon(
                                imageVector = if (type == "private") Icons.Rounded.Lock else Icons.Rounded.Tag,
                                contentDescription = null,
                                tint = SidebarTokens.TextMuted
                            )
                        },
                        trailingIcon = {
                            IconButton(onClick = { dropdownExpanded = true }) {
                                Icon(
                                    imageVector = if (dropdownExpanded) Icons.Rounded.KeyboardArrowUp else Icons.Rounded.KeyboardArrowDown,
                                    contentDescription = "Expand",
                                    tint = SidebarTokens.TextMuted
                                )
                            }
                        },
                        colors = fieldColors,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { dropdownExpanded = true },
                        shape = RoundedCornerShape(8.dp),
                        enabled = true
                    )

                    // Invisible overlay to intercept clicks and open the dropdown
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable { dropdownExpanded = true }
                    )

                    DropdownMenu(
                        expanded = dropdownExpanded,
                        onDismissRequest = { dropdownExpanded = false },
                        modifier = Modifier
                            .fillMaxWidth(0.85f)
                            .background(SidebarTokens.SurfaceBase)
                    ) {
                        DropdownMenuItem(
                            text = {
                                Column {
                                    Text("Public Channel", color = SidebarTokens.TextBright, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("Anyone in the workspace can join", color = SidebarTokens.TextMuted, fontSize = 11.sp)
                                }
                            },
                            leadingIcon = { Icon(Icons.Rounded.Tag, contentDescription = null, tint = SidebarTokens.TextMuted) },
                            onClick = {
                                type = "public"
                                dropdownExpanded = false
                            }
                        )
                        DropdownMenuItem(
                            text = {
                                Column {
                                    Text("Private Channel", color = SidebarTokens.TextBright, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("Only invited members can see it", color = SidebarTokens.TextMuted, fontSize = 11.sp)
                                }
                            },
                            leadingIcon = { Icon(Icons.Rounded.Lock, contentDescription = null, tint = SidebarTokens.TextMuted) },
                            onClick = {
                                type = "private"
                                dropdownExpanded = false
                            }
                        )
                    }
                }

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Channel Name") },
                    placeholder = { Text("new-channel") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    leadingIcon = {
                        Icon(
                            imageVector = if (type == "private") Icons.Rounded.Lock else Icons.Rounded.Tag,
                            contentDescription = null,
                            tint = SidebarTokens.TextMuted
                        )
                    },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    shape = RoundedCornerShape(8.dp),
                    colors = fieldColors
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    placeholder = { Text("What is this channel about?") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(Icons.Rounded.Notes, contentDescription = null, tint = SidebarTokens.TextMuted) },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    minLines = 2,
                    maxLines = 3,
                    shape = RoundedCornerShape(8.dp),
                    colors = fieldColors
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Cancel", color = SidebarTokens.TextMuted, fontWeight = FontWeight.SemiBold)
                    }

                    Button(
                        onClick = {
                            onCreate(
                                CreateChannelRequest(
                                    name = name.trim(),
                                    description = description.ifBlank { null },
                                    type = type
                                ),
                                selectedIcon
                            )
                        },
                        enabled = name.isNotBlank() && !isLoading,
                        modifier = Modifier.weight(2f),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SidebarTokens.Accent,
                            disabledContainerColor = SidebarTokens.Accent.copy(alpha = 0.4f)
                        )
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("Create Channel", fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                    }
                }
            }
        }
    }

    if (showIconPicker) {
        IconPickerDialog(
            selected = selectedIcon,
            onDismiss = { showIconPicker = false },
            onSelect = {
                selectedIcon = it
                showIconPicker = false
            }
        )
    }
}

/** Round avatar preview for the currently selected channel icon (preset glyph or custom image). */
@Composable
private fun ChannelIconAvatar(
    selection: ChannelIconSelection,
    size: androidx.compose.ui.unit.Dp,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .then(
                when (selection) {
                    is ChannelIconSelection.Preset -> Modifier.background(selection.color)
                    is ChannelIconSelection.Custom -> Modifier.background(SidebarTokens.SurfaceFooter)
                }
            )
            .border(1.dp, SidebarTokens.HairlineStrong, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        when (selection) {
            is ChannelIconSelection.Preset -> Icon(
                imageVector = selection.icon,
                contentDescription = selection.label,
                tint = Color.White,
                modifier = Modifier.size(size / 2)
            )
            is ChannelIconSelection.Custom -> AsyncImage(
                model = selection.uri,
                contentDescription = "Custom channel icon",
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
            )
        }

        // Small "edit" badge in the corner, Discord-style.
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .size(size / 3)
                .clip(CircleShape)
                .background(SidebarTokens.SurfaceRaised)
                .border(1.dp, SidebarTokens.HairlineStrong, CircleShape)
                .clip(CircleShape)
                .background(Color.Transparent),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Rounded.Edit,
                contentDescription = "Change icon",
                tint = SidebarTokens.TextMuted,
                modifier = Modifier
                    .size(size / 5)
                    .clip(CircleShape)
            )
        }
    }

    // Keep the click target on the whole avatar without fighting the badge above.
    Spacer(
        modifier = Modifier
            .size(0.dp)
    )
}

/**
 * Discord-style icon picker: a grid of tinted preset glyphs plus a tile to
 * upload a custom image from the device gallery.
 */
@Composable
private fun IconPickerDialog(
    selected: ChannelIconSelection,
    onDismiss: () -> Unit,
    onSelect: (ChannelIconSelection) -> Unit
) {
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { onSelect(ChannelIconSelection.Custom(it)) }
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = SidebarTokens.SurfaceRaised
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Choose an Icon",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = SidebarTokens.TextBright
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = Icons.Rounded.Close,
                            contentDescription = "Close",
                            tint = SidebarTokens.TextMuted,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                LazyVerticalGrid(
                    columns = GridCells.Fixed(4),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.heightIn(max = 320.dp)
                ) {
                    // Custom upload tile, always shown first — same spot Discord puts "Upload Image".
                    item {
                        IconPickerTile(
                            isSelected = selected is ChannelIconSelection.Custom,
                            onClick = { imagePickerLauncher.launch("image/*") }
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Upload,
                                contentDescription = "Upload custom icon",
                                tint = SidebarTokens.TextMuted,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    items(PRESET_CHANNEL_ICONS) { preset ->
                        val isSelected = selected is ChannelIconSelection.Preset &&
                            selected.icon == preset.icon && selected.color == preset.color
                        IconPickerTile(
                            isSelected = isSelected,
                            backgroundColor = preset.color,
                            onClick = { onSelect(preset) }
                        ) {
                            Icon(
                                imageVector = preset.icon,
                                contentDescription = preset.label,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }

                Text(
                    "PNG, JPG. Square images look best.",
                    fontSize = 11.sp,
                    color = SidebarTokens.TextFaint
                )
            }
        }
    }
}

/** Single square-ish tile in the icon picker grid, either a preset color chip or the upload tile. */
@Composable
private fun IconPickerTile(
    isSelected: Boolean,
    backgroundColor: Color = SidebarTokens.SurfaceBase,
    onClick: () -> Unit,
    content: @Composable () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier
            .aspectRatio(1f)
            .fillMaxWidth(),
        shape = CircleShape,
        color = backgroundColor,
        border = BorderStroke(
            width = if (isSelected) 2.dp else 1.dp,
            color = if (isSelected) SidebarTokens.Accent else SidebarTokens.HairlineStrong
        )
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
            content()
        }
    }
}

/**
 * Full-width selectable row used for the channel type picker: leading
 * glyph in a tinted tile, title + helper copy, trailing radio dot.
 */
@Composable
private fun ChannelTypeRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        color = if (isSelected) SidebarTokens.Accent.copy(alpha = 0.12f) else SidebarTokens.SurfaceBase,
        border = BorderStroke(
            width = 1.dp,
            color = if (isSelected) SidebarTokens.Accent else SidebarTokens.HairlineStrong
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (isSelected) SidebarTokens.Accent.copy(alpha = 0.18f) else SidebarTokens.SurfaceFooter),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (isSelected) SidebarTokens.Accent else SidebarTokens.TextMuted,
                    modifier = Modifier.size(16.dp)
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    color = SidebarTokens.TextBright,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = subtitle,
                    color = SidebarTokens.TextMuted,
                    fontSize = 11.sp
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            RadioDot(isSelected = isSelected)
        }
    }
}

/** Small radio indicator: filled accent dot with a white core when selected, empty ring otherwise. */
@Composable
private fun RadioDot(isSelected: Boolean) {
    Box(
        modifier = Modifier
            .size(18.dp)
            .clip(CircleShape)
            .background(if (isSelected) SidebarTokens.Accent else Color.Transparent)
            .border(
                width = if (isSelected) 0.dp else 1.5.dp,
                color = if (isSelected) Color.Transparent else SidebarTokens.TextFaint,
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        if (isSelected) {
            Box(
                modifier = Modifier
                    .size(7.dp)
                    .clip(CircleShape)
                    .background(Color.White)
            )
        }
    }
}
