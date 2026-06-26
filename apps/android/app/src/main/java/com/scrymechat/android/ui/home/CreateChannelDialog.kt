package com.scrymechat.android.ui.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
    var type by remember { mutableStateOf("text") }
    var selectedCategoryId by remember { mutableStateOf<String?>(null) }
    var expanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
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
                colors = ButtonDefaults.buttonColors(
                    containerColor = SidebarTokens.Accent
                )
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Create Channel")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = SidebarTokens.TextSecondary)
            }
        },
        title = {
            Text(
                "Create New Channel",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = SidebarTokens.TextPrimary
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Channel Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SidebarTokens.Accent,
                        focusedLabelColor = SidebarTokens.Accent,
                        unfocusedTextColor = SidebarTokens.TextPrimary,
                        focusedTextColor = SidebarTokens.TextPrimary
                    )
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SidebarTokens.Accent,
                        focusedLabelColor = SidebarTokens.Accent,
                        unfocusedTextColor = SidebarTokens.TextPrimary,
                        focusedTextColor = SidebarTokens.TextPrimary
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
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SidebarTokens.Accent,
                            focusedLabelColor = SidebarTokens.Accent,
                            unfocusedTextColor = SidebarTokens.TextPrimary,
                            focusedTextColor = SidebarTokens.TextPrimary
                        )
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
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
                        color = SidebarTokens.TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        TypeButton(
                            label = "Text",
                            isSelected = type == "text",
                            onClick = { type = "text" },
                            modifier = Modifier.weight(1f)
                        )
                        TypeButton(
                            label = "Voice",
                            isSelected = type == "voice",
                            onClick = { type = "voice" },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        },
        containerColor = SidebarTokens.SurfaceRaised,
        shape = RoundedCornerShape(16.dp)
    )
}

@Composable
fun TypeButton(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(40.dp),
        shape = RoundedCornerShape(8.dp),
        color = if (isSelected) SidebarTokens.Accent else SidebarTokens.SurfaceBase,
        border = if (isSelected) null else BorderStroke(1.dp, SidebarTokens.Hairline)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = label,
                color = if (isSelected) Color.White else SidebarTokens.TextSecondary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}
