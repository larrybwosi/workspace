package com.scrymechat.android.ui.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.data.remote.WorkspaceMemberWithUserDto
import com.scrymechat.android.ui.components.UserAvatar

@Composable
fun AddChannelMembersDialog(
    workspaceMembers: List<WorkspaceMemberWithUserDto>,
    existingMemberUserIds: Set<String>,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onAddMembers: (userIds: List<String>) -> Unit
) {
    val selectedUserIds = remember { mutableStateListOf<String>() }
    var searchQuery by remember { mutableStateOf("") }

    val availableMembers = remember(workspaceMembers, existingMemberUserIds, searchQuery) {
        workspaceMembers.filter { member ->
            !existingMemberUserIds.contains(member.userId) &&
                    (searchQuery.isBlank() || member.user.name.contains(searchQuery, ignoreCase = true) || member.user.email.contains(searchQuery, ignoreCase = true))
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Add Members to Channel",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search members...") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 200.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    items(availableMembers, key = { it.userId }) { member ->
                        val isSelected = selectedUserIds.contains(member.userId)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    if (isSelected) selectedUserIds.remove(member.userId)
                                    else selectedUserIds.add(member.userId)
                                }
                                .padding(vertical = 6.dp, horizontal = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                UserAvatar(
                                    name = member.user.name,
                                    avatarUrl = member.user.avatar,
                                    size = 32.dp
                                )
                                Column {
                                    Text(
                                        text = member.user.name,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = member.user.email,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Checkbox(
                                checked = isSelected,
                                onCheckedChange = {
                                    if (it) selectedUserIds.add(member.userId)
                                    else selectedUserIds.remove(member.userId)
                                }
                            )
                        }
                    }

                    if (availableMembers.isEmpty()) {
                        item {
                            Text(
                                text = "No available members to add",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(vertical = 16.dp)
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onAddMembers(selectedUserIds.toList()) },
                enabled = !isLoading && selectedUserIds.isNotEmpty()
            ) {
                Text(if (isLoading) "Adding..." else "Add Selected (${selectedUserIds.size})")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) {
                Text("Cancel")
            }
        }
    )
}
