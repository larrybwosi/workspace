package com.scrymechat.android.ui.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.data.remote.CreateWorkspaceRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateWorkspaceDialog(
    onDismiss: () -> Unit,
    onCreate: (CreateWorkspaceRequest) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var slug by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var isPublic by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    onCreate(
                        CreateWorkspaceRequest(
                            name = name,
                            slug = slug.ifBlank { name.lowercase().replace(" ", "-") },
                            description = description.ifBlank { null },
                            isPublic = isPublic
                        )
                    )
                    onDismiss()
                },
                enabled = name.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = SidebarTokens.Accent
                )
            ) {
                Text("Create Workspace")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = SidebarTokens.TextSecondary)
            }
        },
        title = {
            Text(
                "Create New Workspace",
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
                    label = { Text("Workspace Name") },
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
                    value = slug,
                    onValueChange = { slug = it },
                    label = { Text("Workspace Slug (Optional)") },
                    placeholder = { Text(name.lowercase().replace(" ", "-")) },
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

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Checkbox(
                        checked = isPublic,
                        onCheckedChange = { isPublic = it },
                        colors = CheckboxDefaults.colors(
                            checkedColor = SidebarTokens.Accent
                        )
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            "Public Workspace",
                            color = SidebarTokens.TextPrimary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            "Anyone can discover and join this workspace",
                            color = SidebarTokens.TextSecondary,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        },
        containerColor = SidebarTokens.SurfaceRaised,
        shape = RoundedCornerShape(16.dp)
    )
}
