package com.scrymechat.android.ui.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            shape = RoundedCornerShape(24.dp),
            color = SidebarTokens.SurfaceRaised
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                Text(
                    "Create Channel",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = SidebarTokens.TextPrimary
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Channel Name") },
                    placeholder = { Text("e.g. general", color = SidebarTokens.TextSecondary.copy(alpha = 0.5f)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Rounded.Tag, contentDescription = null, tint = SidebarTokens.TextSecondary) },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SidebarTokens.Accent,
                        focusedLabelColor = SidebarTokens.Accent,
                        unfocusedTextColor = SidebarTokens.TextPrimary,
                        focusedTextColor = SidebarTokens.TextPrimary,
                        unfocusedBorderColor = SidebarTokens.TextSecondary.copy(alpha = 0.2f)
                    )
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    placeholder = { Text("What is this channel about?", color = SidebarTokens.TextSecondary.copy(alpha = 0.5f)) },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(Icons.Rounded.Notes, contentDescription = null, tint = SidebarTokens.TextSecondary) },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SidebarTokens.Accent,
                        focusedLabelColor = SidebarTokens.Accent,
                        unfocusedTextColor = SidebarTokens.TextPrimary,
                        focusedTextColor = SidebarTokens.TextPrimary,
                        unfocusedBorderColor = SidebarTokens.TextSecondary.copy(alpha = 0.2f)
                    )
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
                        leadingIcon = { Icon(Icons.Rounded.Folder, contentDescription = null, tint = SidebarTokens.TextSecondary) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SidebarTokens.Accent,
                            focusedLabelColor = SidebarTokens.Accent,
                            unfocusedTextColor = SidebarTokens.TextPrimary,
                            focusedTextColor = SidebarTokens.TextPrimary,
                            unfocusedBorderColor = SidebarTokens.TextSecondary.copy(alpha = 0.2f)
                        )
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                        modifier = Modifier.background(SidebarTokens.SurfaceRaised)
                    ) {
                        DropdownMenuItem(
                            text = { Text("No Category", color = SidebarTokens.TextPrimary) },
                            onClick = {
                                selectedCategoryId = null
                                expanded = false
                            }
                        )
                        categories.forEach { category ->
                            DropdownMenuItem(
                                text = { Text(category.name, color = SidebarTokens.TextPrimary) },
                                onClick = {
                                    selectedCategoryId = category.id
                                    expanded = false
                                }
                            )
                        }
                    }
                }

                // Channel Type
                Column {
                    Text(
                        "Channel Type",
                        color = SidebarTokens.TextSecondary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        TypeButton(
                            label = "Public",
                            isSelected = type == "public",
                            icon = Icons.Rounded.Public,
                            onClick = { type = "public" },
                            modifier = Modifier.weight(1f)
                        )
                        TypeButton(
                            label = "Private",
                            isSelected = type == "private",
                            icon = Icons.Rounded.Lock,
                            onClick = { type = "private" },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Cancel", color = SidebarTokens.TextSecondary)
                    }

                    Button(
                        onClick = {
                            onCreate(
                                CreateChannelRequest(
                                    name = name,
                                    description = description.ifBlank { null },
                                    type = type
                                ),
                                selectedCategoryId
                            )
                        },
                        enabled = name.isNotBlank() && !isLoading,
                        modifier = Modifier.weight(2f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SidebarTokens.Accent,
                            disabledContainerColor = SidebarTokens.Accent.copy(alpha = 0.5f)
                        )
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("Create Channel", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TypeButton(
    label: String,
    isSelected: Boolean,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(44.dp),
        shape = RoundedCornerShape(12.dp),
        color = if (isSelected) SidebarTokens.Accent.copy(alpha = 0.15f) else Color.Transparent,
        border = BorderStroke(
            width = 1.5.dp,
            color = if (isSelected) SidebarTokens.Accent else SidebarTokens.TextSecondary.copy(alpha = 0.2f)
        )
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) SidebarTokens.Accent else SidebarTokens.TextSecondary,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = label,
                color = if (isSelected) SidebarTokens.Accent else SidebarTokens.TextSecondary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
