package com.scrymechat.android.ui.profile

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.scrymechat.android.ui.theme.*
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

/**
 * Shared layout tokens. Centralizing these keeps spacing/radius consistent
 * across every settings surface instead of ad-hoc dp values per screen.
 */
private object SettingsTokens {
    val ScreenPadding = 20.dp
    val SectionSpacing = 28.dp
    val FieldSpacing = 14.dp
    val CardRadius = 12.dp
    val CardBorderWidth = 1.dp
    val RowVerticalPadding = 14.dp
}

@Composable
private fun SectionHeader(
    title: String,
    palette: ProfilePalette,
    subtitle: String? = null
) {
    Column {
        Text(
            text = title.uppercase(),
            color = palette.textTertiary,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold
        )
        if (subtitle != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = subtitle,
                color = palette.textSecondary,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

/**
 * A neutral, low-emphasis card container used to group related settings —
 * mirrors the "panel" pattern common in enterprise admin consoles.
 */
@Composable
private fun SettingsCard(
    palette: ProfilePalette,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(SettingsTokens.CardRadius))
            .background(palette.cardSurface)
            .border(SettingsTokens.CardBorderWidth, palette.cardBorder, RoundedCornerShape(SettingsTokens.CardRadius))
            .padding(16.dp),
        content = content
    )
}

@Composable
private fun standardTextFieldColors(palette: ProfilePalette) = OutlinedTextFieldDefaults.colors(
    focusedTextColor = palette.textPrimary,
    unfocusedTextColor = palette.textPrimary,
    focusedBorderColor = palette.accent,
    unfocusedBorderColor = palette.cardBorder,
    focusedLabelColor = palette.accent,
    unfocusedLabelColor = palette.textSecondary,
    cursorColor = palette.accent
)

@Composable
private fun SettingsTopBar(
    title: String,
    palette: ProfilePalette,
    onBack: () -> Unit
) {
    TopAppBar(
        title = {
            Text(
                title,
                color = palette.textPrimary,
                fontWeight = FontWeight.SemiBold
            )
        },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
    )
}

// ---------------------------------------------------------------------------
// My Account
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
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

/** A labeled row with a trailing action button — used for one-off settings actions. */
@Composable
private fun SettingsActionRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String,
    actionLabel: String,
    palette: ProfilePalette,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(palette.accent.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = palette.accent, modifier = Modifier.size(18.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = palette.textPrimary, fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodyLarge)
            Text(description, color = palette.textSecondary, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(modifier = Modifier.width(12.dp))
        OutlinedButton(
            onClick = onClick,
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = palette.accent)
        ) {
            Text(actionLabel)
        }
    }
}

@Composable
fun ChangePasswordDialog(
    palette: ProfilePalette,
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

// ---------------------------------------------------------------------------
// Voice Settings
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoiceSettingsScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val palette = profilePalette()
    val voiceMode by viewModel.voiceMode.collectAsState()

    Scaffold(
        topBar = { SettingsTopBar("Voice", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding)
        ) {
            SectionHeader(
                title = "Input Mode",
                subtitle = "Choose how your microphone is activated during calls.",
                palette = palette
            )
            Spacer(modifier = Modifier.height(16.dp))
            SettingsCard(palette) {
                SelectableOptionRow(
                    label = "Voice Activity",
                    description = "Automatically transmit when you speak.",
                    selected = voiceMode == "voice_activity",
                    palette = palette,
                    onSelect = { viewModel.updateVoiceMode("voice_activity") }
                )
                HorizontalDivider(color = palette.cardBorder, modifier = Modifier.padding(vertical = 4.dp))
                SelectableOptionRow(
                    label = "Push to Talk",
                    description = "Hold a key or button to transmit audio.",
                    selected = voiceMode == "push_to_talk",
                    palette = palette,
                    onSelect = { viewModel.updateVoiceMode("push_to_talk") }
                )
            }
        }
    }
}

@Composable
private fun SelectableOptionRow(
    label: String,
    description: String? = null,
    selected: Boolean,
    palette: ProfilePalette,
    onSelect: () -> Unit
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onSelect)
            .padding(vertical = SettingsTokens.RowVerticalPadding / 2)
    ) {
        RadioButton(
            selected = selected,
            onClick = onSelect,
            colors = RadioButtonDefaults.colors(selectedColor = palette.accent)
        )
        Column {
            Text(label, color = palette.textPrimary, fontWeight = FontWeight.Medium)
            if (description != null) {
                Text(description, color = palette.textSecondary, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Language Settings
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LanguageSettingsScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val palette = profilePalette()
    val selectedLanguage by viewModel.language.collectAsState()

    Scaffold(
        topBar = { SettingsTopBar("Language", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding)
        ) {
            SectionHeader(title = "Display Language", palette = palette)
            Spacer(modifier = Modifier.height(16.dp))
            SettingsCard(palette) {
                LanguageOption("English (US)", "en_us", selectedLanguage, palette) { viewModel.updateLanguage(it) }
                HorizontalDivider(color = palette.cardBorder, modifier = Modifier.padding(vertical = 4.dp))
                LanguageOption("English (UK)", "en_uk", selectedLanguage, palette) { viewModel.updateLanguage(it) }
            }
        }
    }
}

@Composable
fun LanguageOption(label: String, value: String, selectedValue: String, palette: ProfilePalette, onSelect: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect(value) }
            .padding(vertical = SettingsTokens.RowVerticalPadding),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = palette.textPrimary, modifier = Modifier.weight(1f))
        if (value == selectedValue) {
            Icon(Icons.Default.Check, contentDescription = "Selected", tint = palette.accent)
        }
    }
}

// ---------------------------------------------------------------------------
// Authorized Apps
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthorizedAppsScreen(onBack: () -> Unit) {
    val palette = profilePalette()
    Scaffold(
        topBar = { SettingsTopBar("Authorized Apps", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding)
        ) {
            SectionHeader(
                title = "Connected Applications",
                subtitle = "Third-party applications with access to your account.",
                palette = palette
            )
            Spacer(modifier = Modifier.height(16.dp))
            SettingsCard(palette) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Apps,
                        contentDescription = null,
                        tint = palette.textTertiary,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("No apps authorized yet", color = palette.textPrimary, fontWeight = FontWeight.Medium)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Applications you authorize will appear here.",
                        color = palette.textSecondary,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserProfileScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val palette = profilePalette()
    val user = uiState.currentUser
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    var name by remember(user) { mutableStateOf(user?.name ?: "") }
    var username by remember(user) { mutableStateOf(user?.username ?: "") }
    var statusText by remember(user) { mutableStateOf(user?.statusText ?: "") }

    LaunchedEffect(Unit) {
        viewModel.errorEvents.collect { error ->
            snackbarHostState.showSnackbar(error)
        }
    }

    val avatarLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let { viewModel.setPendingAvatar(it) }
    }

    val bannerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let { viewModel.setPendingBanner(it) }
    }

    Scaffold(
        topBar = { SettingsTopBar("User Profile", palette, onBack) },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = palette.canvasBg
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding),
            verticalArrangement = Arrangement.spacedBy(SettingsTokens.SectionSpacing)
        ) {
            item {
                Text(
                    "Preview and edit your profile as it appears to others.",
                    color = palette.textSecondary,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Profile Preview Card
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(SettingsTokens.CardRadius))
                        .background(palette.cardSurface)
                        .border(SettingsTokens.CardBorderWidth, palette.cardBorder, RoundedCornerShape(SettingsTokens.CardRadius))
                ) {
                    // Banner
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                            .background(if (user?.banner == null && uiState.pendingBannerUri == null) palette.accent.copy(alpha = 0.12f) else Color.Transparent)
                            .clickable { bannerLauncher.launch("image/*") }
                    ) {
                        val bannerModel = uiState.pendingBannerUri ?: user?.banner
                        if (bannerModel != null) {
                            AsyncImage(
                                model = bannerModel,
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .padding(10.dp)
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.45f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit Banner", tint = Color.White, modifier = Modifier.size(16.dp))
                        }
                    }

                    // Avatar and Info
                    Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                        Column {
                            Spacer(modifier = Modifier.height(44.dp)) // space for overlapping avatar
                            Text(name, color = palette.textPrimary, fontWeight = FontWeight.SemiBold, fontSize = 20.sp)
                            Text("@$username", color = palette.textSecondary, fontSize = 14.sp)
                            if (statusText.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(statusText, color = palette.textPrimary, fontSize = 15.sp)
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        // Overlapping Avatar
                        Box(
                            modifier = Modifier
                                .offset(y = (-40).dp)
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(palette.cardSurface)
                                .padding(4.dp)
                                .clip(CircleShape)
                                .clickable { avatarLauncher.launch("image/*") }
                        ) {
                            val avatarModel = uiState.pendingAvatarUri ?: user?.avatar
                            if (avatarModel != null) {
                                AsyncImage(
                                    model = avatarModel,
                                    contentDescription = null,
                                    modifier = Modifier.fillMaxSize().clip(CircleShape)
                                )
                            } else {
                                Box(
                                    modifier = Modifier.fillMaxSize().background(palette.accent),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text((user?.name?.firstOrNull() ?: 'U').toString(), color = Color.White, fontSize = 32.sp)
                                }
                            }
                            Box(
                                modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.CameraAlt, contentDescription = "Edit Avatar", tint = Color.White, modifier = Modifier.size(22.dp))
                            }
                        }
                    }
                }
            }

            item {
                SectionHeader(title = "Profile Details", palette = palette)
                Spacer(modifier = Modifier.height(16.dp))
                SettingsCard(palette) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Display Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = standardTextFieldColors(palette)
                    )
                    Spacer(modifier = Modifier.height(SettingsTokens.FieldSpacing))
                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text("Username") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = standardTextFieldColors(palette)
                    )
                    Spacer(modifier = Modifier.height(SettingsTokens.FieldSpacing))
                    OutlinedTextField(
                        value = statusText,
                        onValueChange = { statusText = it },
                        label = { Text("About Me") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        colors = standardTextFieldColors(palette)
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = {
                            viewModel.saveProfile(mapOf(
                                "name" to name,
                                "username" to username,
                                "statusText" to statusText
                            ), context)
                        },
                        modifier = Modifier.fillMaxWidth().height(44.dp),
                        enabled = !uiState.isUploading,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = palette.accent)
                    ) {
                        if (uiState.isUploading) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text("Save Profile", fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }
    }
}

private fun android.content.Context.uriToFile(uri: Uri): File {
    val inputStream = contentResolver.openInputStream(uri)
    val file = File(cacheDir, "upload_${UUID.randomUUID()}.jpg")
    val outputStream = FileOutputStream(file)
    inputStream?.use { input ->
        outputStream.use { output ->
            input.copyTo(output)
        }
    }
    return file
}

// ---------------------------------------------------------------------------
// Privacy & Safety
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrivacySafetyScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val palette = profilePalette()
    val uiState by viewModel.uiState.collectAsState()

    // In a real app, these would come from user.preferences or similar
    var allowDms by remember { mutableStateOf(true) }

    Scaffold(
        topBar = { SettingsTopBar("Privacy & Safety", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding)
        ) {
            SectionHeader(
                title = "Direct Message Safety",
                subtitle = "Control who can start a direct conversation with you.",
                palette = palette
            )
            Spacer(modifier = Modifier.height(16.dp))
            SettingsCard(palette) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Allow direct messages from server members", color = palette.textPrimary, fontWeight = FontWeight.Medium)
                        Text(
                            "Members of shared servers can message you directly.",
                            color = palette.textSecondary,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Switch(
                        checked = allowDms,
                        onCheckedChange = {
                            allowDms = it
                            viewModel.updateProfile(mapOf("privacySettings" to mapOf("allowDmsFromMembers" to it)))
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = palette.accent, checkedTrackColor = palette.accent.copy(alpha = 0.5f))
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppearanceSettingsScreen(
    onBack: () -> Unit,
    currentTheme: String,
    onThemeChange: (String) -> Unit
) {
    val palette = profilePalette()
    Scaffold(
        topBar = { SettingsTopBar("Appearance", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding)
        ) {
            SectionHeader(
                title = "Theme",
                subtitle = "Choose how the app looks on this device.",
                palette = palette
            )
            Spacer(modifier = Modifier.height(16.dp))
            SettingsCard(palette) {
                ThemeOption("System Default", "system", currentTheme, onThemeChange, palette)
                HorizontalDivider(color = palette.cardBorder, modifier = Modifier.padding(vertical = 4.dp))
                ThemeOption("Dark", "dark", currentTheme, onThemeChange, palette)
                HorizontalDivider(color = palette.cardBorder, modifier = Modifier.padding(vertical = 4.dp))
                ThemeOption("Light", "light", currentTheme, onThemeChange, palette)
            }
        }
    }
}

@Composable
fun ThemeOption(label: String, value: String, currentValue: String, onSelect: (String) -> Unit, palette: ProfilePalette) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect(value) }
            .padding(vertical = SettingsTokens.RowVerticalPadding / 2)
    ) {
        RadioButton(
            selected = currentValue == value,
            onClick = { onSelect(value) },
            colors = RadioButtonDefaults.colors(selectedColor = palette.accent)
        )
        Text(label, color = palette.textPrimary, modifier = Modifier.padding(start = 8.dp), fontWeight = FontWeight.Medium)
    }
}
