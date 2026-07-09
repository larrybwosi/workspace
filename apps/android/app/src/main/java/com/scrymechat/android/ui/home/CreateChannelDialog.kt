package com.scrymechat.android.ui.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.remote.CreateChannelRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateChannelDialog(
    categories: List<ChannelEntity>,
    isLoading: Boolean = false,
    onDismiss: () -> Unit,
    onCreate: (CreateChannelRequest, String?) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("public") }
    var selectedCategoryId by remember { mutableStateOf<String?>(null) }
    var expanded by remember { mutableStateOf(false) }

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
                    Column {
                        Text(
                            "Create Channel",
                            fontSize = 19.sp,
                            fontWeight = FontWeight.Bold,
                            color = SidebarTokens.TextBright
                        )
                        Text(
                            "in ${categories.find { it.id == selectedCategoryId }?.name ?: "no category"}",
                            fontSize = 12.sp,
                            color = SidebarTokens.TextMuted
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = Icons.Rounded.Close,
                            contentDescription = "Close",
                            tint = SidebarTokens.TextMuted,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                // Channel Type — selectable rows, mirroring Discord's own
                // Text/Voice channel-type chooser rather than two squeezed
                // toggle buttons.
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    ChannelTypeRow(
                        icon = Icons.Rounded.Tag,
                        title = "Public Channel",
                        subtitle = "Anyone in the workspace can join",
                        isSelected = type == "public",
                        onClick = { type = "public" }
                    )
                    ChannelTypeRow(
                        icon = Icons.Rounded.Lock,
                        title = "Private Channel",
                        subtitle = "Only invited members can see it",
                        isSelected = type == "private",
                        onClick = { type = "private" }
                    )
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

                // Category Selection
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = categories.find { it.id == selectedCategoryId }?.name ?: "No Category",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Category") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        leadingIcon = { Icon(Icons.Rounded.Folder, contentDescription = null, tint = SidebarTokens.TextMuted) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = fieldColors
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                        modifier = Modifier.background(SidebarTokens.SurfaceRaised)
                    ) {
                        DropdownMenuItem(
                            text = { Text("No Category", color = SidebarTokens.TextPrimary) },
                            leadingIcon = {
                                if (selectedCategoryId == null) {
                                    Icon(
                                        Icons.Rounded.Check,
                                        contentDescription = null,
                                        tint = SidebarTokens.Accent,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            },
                            onClick = {
                                selectedCategoryId = null
                                expanded = false
                            }
                        )
                        categories.forEach { category ->
                            DropdownMenuItem(
                                text = { Text(category.name, color = SidebarTokens.TextPrimary) },
                                leadingIcon = {
                                    if (selectedCategoryId == category.id) {
                                        Icon(
                                            Icons.Rounded.Check,
                                            contentDescription = null,
                                            tint = SidebarTokens.Accent,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                },
                                onClick = {
                                    selectedCategoryId = category.id
                                    expanded = false
                                }
                            )
                        }
                    }
                }

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
                                selectedCategoryId
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
