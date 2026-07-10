package com.scrymechat.android.ui.profile.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scrymechat.android.ui.profile.ProfileViewModel
import com.scrymechat.android.ui.profile.profilePalette

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun MyAccountScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val palette = profilePalette()
    val user = uiState.currentUser

    var name by remember(user) { mutableStateOf(user?.name ?: "") }
    var email by remember(user) { mutableStateOf(user?.email ?: "") }
    var showChangePasswordDialog by remember { mutableStateOf(false) }

    val hasChanges = name != (user?.name ?: "") || email != (user?.email ?: "")
    val isEmailValid = email.isBlank() || android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()

    Scaffold(
        topBar = { SettingsTopBar("My Account", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding),
            verticalArrangement = Arrangement.spacedBy(SettingsTokens.SectionSpacing)
        ) {
            item {
                Column {
                    SectionHeader(
                        title = "Account Information",
                        subtitle = "This information may be visible to other members of your organization.",
                        palette = palette
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    SettingsCard(palette) {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Full Name") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = standardTextFieldColors(palette)
                        )
                        Spacer(modifier = Modifier.height(SettingsTokens.FieldSpacing))
                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text("Email Address") },
                            singleLine = true,
                            isError = !isEmailValid,
                            supportingText = {
                                if (!isEmailValid) {
                                    Text("Enter a valid email address", color = MaterialTheme.colorScheme.error)
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = standardTextFieldColors(palette)
                        )
                        Spacer(modifier = Modifier.height(20.dp))
                        Button(
                            onClick = { viewModel.updateProfile(mapOf("name" to name, "email" to email)) },
                            modifier = Modifier.fillMaxWidth().height(44.dp),
                            enabled = hasChanges && isEmailValid,
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = palette.accent)
                        ) {
                            Text("Save Changes", fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
            item {
                Column {
                    SectionHeader(
                        title = "Password & Authentication",
                        subtitle = "Manage how you sign in and secure your account.",
                        palette = palette
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    SettingsCard(palette) {
                        SettingsActionRow(
                            icon = Icons.Default.Lock,
                            title = "Password",
                            description = "Last changed unavailable — update it periodically for account security.",
                            actionLabel = "Change",
                            palette = palette,
                            onClick = { showChangePasswordDialog = true }
                        )
                    }
                }
            }
        }
    }

    if (showChangePasswordDialog) {
        ChangePasswordDialog(
            palette = palette,
            onDismiss = { showChangePasswordDialog = false },
            onConfirm = { current, new ->
                viewModel.changePassword(current, new) {
                    showChangePasswordDialog = false
                }
            }
        )
    }
}

@Composable
fun ChangePasswordDialog(
    palette: com.scrymechat.android.ui.profile.ProfilePalette,
    onDismiss: () -> Unit,
    onConfirm: (String, String) -> Unit
) {
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }

    val passwordsMatch = confirmPassword.isEmpty() || newPassword == confirmPassword
    val meetsLength = newPassword.length >= 8

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change Password", color = palette.textPrimary, fontWeight = FontWeight.SemiBold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(SettingsTokens.FieldSpacing)) {
                Text(
                    "Choose a strong password you don't use elsewhere.",
                    color = palette.textSecondary,
                    style = MaterialTheme.typography.bodySmall
                )
                OutlinedTextField(
                    value = currentPassword,
                    onValueChange = { currentPassword = it },
                    label = { Text("Current Password") },
                    singleLine = true,
                    visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = standardTextFieldColors(palette)
                )
                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it },
                    label = { Text("New Password") },
                    singleLine = true,
                    isError = newPassword.isNotEmpty() && !meetsLength,
                    supportingText = { Text("Minimum 8 characters", color = palette.textTertiary) },
                    visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = standardTextFieldColors(palette)
                )
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text("Confirm New Password") },
                    singleLine = true,
                    isError = !passwordsMatch,
                    supportingText = {
                        if (!passwordsMatch) Text("Passwords do not match", color = MaterialTheme.colorScheme.error)
                    },
                    visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = standardTextFieldColors(palette)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(currentPassword, newPassword) },
                enabled = currentPassword.isNotEmpty() && meetsLength && newPassword == confirmPassword,
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = palette.accent)
            ) {
                Text("Update Password")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = palette.textSecondary)
            }
        },
        containerColor = palette.cardSurface,
        shape = RoundedCornerShape(SettingsTokens.CardRadius)
    )
}
