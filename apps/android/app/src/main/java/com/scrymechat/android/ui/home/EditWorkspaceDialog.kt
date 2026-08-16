package com.scrymechat.android.ui.home

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.data.local.entities.WorkspaceEntity

@Composable
fun EditWorkspaceDialog(
    workspace: WorkspaceEntity,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onSave: (name: String, description: String?, icon: String?, banner: String?) -> Unit
) {
    var name by remember { mutableStateOf(workspace.name) }
    var description by remember { mutableStateOf(workspace.description ?: "") }
    var icon by remember { mutableStateOf(workspace.icon ?: "") }
    var banner by remember { mutableStateOf(workspace.banner ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Edit Workspace Settings",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Workspace Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = icon,
                    onValueChange = { icon = it },
                    label = { Text("Icon URL or Emoji") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = banner,
                    onValueChange = { banner = it },
                    label = { Text("Banner Image URL") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        onSave(
                            name,
                            description.ifBlank { null },
                            icon.ifBlank { null },
                            banner.ifBlank { null }
                        )
                    }
                },
                enabled = !isLoading && name.isNotBlank()
            ) {
                Text(if (isLoading) "Saving..." else "Save Changes")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) {
                Text("Cancel")
            }
        }
    )
}
