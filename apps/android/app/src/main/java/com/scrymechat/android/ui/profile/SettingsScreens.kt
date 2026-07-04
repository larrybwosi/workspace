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
import androidx.compose.ui.graphics.Brush
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

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Account", color = palette.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
            )
        },
        containerColor = palette.canvasBg
    ) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            item {
                Text("ACCOUNT INFORMATION", color = palette.textTertiary, style = MaterialTheme.typography.labelMedium)
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = palette.textPrimary,
                        unfocusedTextColor = palette.textPrimary,
                        focusedBorderColor = palette.accent,
                        unfocusedBorderColor = palette.cardBorder
                    )
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = palette.textPrimary,
                        unfocusedTextColor = palette.textPrimary,
                        focusedBorderColor = palette.accent,
                        unfocusedBorderColor = palette.cardBorder
                    )
                )

                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = { viewModel.updateProfile(mapOf("name" to name, "email" to email)) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = palette.accent)
                ) {
                    Text("Save Changes")
                }
            }
            item {
                Spacer(modifier = Modifier.height(32.dp))
                Text("PASSWORD AND AUTHENTICATION", color = palette.textTertiary, style = MaterialTheme.typography.labelMedium)
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedButton(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = palette.accent)
                ) {
                    Text("Change Password")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoiceSettingsScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val palette = profilePalette()
    // Mock preference persistence
    var inputMode by remember { mutableStateOf("voice_activity") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Voice", color = palette.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
            )
        },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Text("INPUT MODE", color = palette.textTertiary, style = MaterialTheme.typography.labelMedium)
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth().clickable { inputMode = "voice_activity" }
            ) {
                RadioButton(
                    selected = inputMode == "voice_activity",
                    onClick = { inputMode = "voice_activity" },
                    colors = RadioButtonDefaults.colors(selectedColor = palette.accent)
                )
                Text("Voice Activity", color = palette.textPrimary)
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth().clickable { inputMode = "push_to_talk" }
            ) {
                RadioButton(
                    selected = inputMode == "push_to_talk",
                    onClick = { inputMode = "push_to_talk" },
                    colors = RadioButtonDefaults.colors(selectedColor = palette.accent)
                )
                Text("Push to Talk", color = palette.textPrimary)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LanguageSettingsScreen(onBack: () -> Unit) {
    val palette = profilePalette()
    var selectedLanguage by remember { mutableStateOf("en_us") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Language", color = palette.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
            )
        },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            LanguageOption("English (US)", "en_us", selectedLanguage, palette) { selectedLanguage = it }
            LanguageOption("English (UK)", "en_uk", selectedLanguage, palette) { selectedLanguage = it }
        }
    }
}

@Composable
fun LanguageOption(label: String, value: String, selectedValue: String, palette: ProfilePalette, onSelect: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onSelect(value) }.padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = palette.textPrimary, modifier = Modifier.weight(1f))
        if (value == selectedValue) {
            Icon(Icons.Default.Check, contentDescription = null, tint = palette.accent)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthorizedAppsScreen(onBack: () -> Unit) {
    val palette = profilePalette()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Authorized Apps", color = palette.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
            )
        },
        containerColor = palette.canvasBg
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Text("No apps authorized yet.", color = palette.textSecondary)
        }
    }
}

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
        uri?.let {
            val file = context.uriToFile(it)
            viewModel.uploadImage(file, "avatar")
        }
    }

    val bannerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            val file = context.uriToFile(it)
            viewModel.uploadImage(file, "banner")
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("User Profile", color = palette.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = palette.canvasBg
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            item {
                Text("Preview and edit your global profile.", color = palette.textSecondary, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(24.dp))
            }

            // Profile Preview Card
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(palette.cardSurface)
                        .border(1.dp, palette.cardBorder, RoundedCornerShape(20.dp))
                ) {
                    // Banner
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                            .background(if (user?.banner == null) palette.accent.copy(alpha = 0.2f) else Color.Transparent)
                            .clickable { bannerLauncher.launch("image/*") }
                    ) {
                        if (user?.banner != null) {
                            AsyncImage(
                                model = user.banner,
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                        Box(
                            modifier = Modifier
                                .align(Alignment.Center)
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.4f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit Banner", tint = Color.White, modifier = Modifier.size(20.dp))
                        }
                    }

                    // Avatar and Info
                    Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                        Column {
                            Spacer(modifier = Modifier.height(44.dp)) // space for overlapping avatar
                            Text(name, color = palette.textPrimary, fontWeight = FontWeight.Bold, fontSize = 20.sp)
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
                            if (user?.avatar != null) {
                                AsyncImage(
                                    model = user.avatar,
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
                                modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.CameraAlt, contentDescription = "Edit Avatar", tint = Color.White, modifier = Modifier.size(24.dp))
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }

            item {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Display Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = palette.textPrimary,
                        unfocusedTextColor = palette.textPrimary,
                        focusedBorderColor = palette.accent,
                        unfocusedBorderColor = palette.cardBorder
                    )
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("Username") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = palette.textPrimary,
                        unfocusedTextColor = palette.textPrimary,
                        focusedBorderColor = palette.accent,
                        unfocusedBorderColor = palette.cardBorder
                    )
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = statusText,
                    onValueChange = { statusText = it },
                    label = { Text("About Me") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = palette.textPrimary,
                        unfocusedTextColor = palette.textPrimary,
                        focusedBorderColor = palette.accent,
                        unfocusedBorderColor = palette.cardBorder
                    )
                )
                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = {
                        viewModel.updateProfile(mapOf(
                            "name" to name,
                            "username" to username,
                            "statusText" to statusText
                        ))
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isUploading,
                    colors = ButtonDefaults.buttonColors(containerColor = palette.accent)
                ) {
                    if (uiState.isUploading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("Save Profile")
                    }
                }
                Spacer(modifier = Modifier.height(40.dp))
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrivacySafetyScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val palette = profilePalette()
    val uiState by viewModel.uiState.collectAsState()
    val user = uiState.currentUser

    // In a real app, these would come from the user.preferences or similar
    var allowDms by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Privacy & Safety", color = palette.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
            )
        },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Text("DIRECT MESSAGE SAFETY", color = palette.textTertiary, style = MaterialTheme.typography.labelMedium)
            Spacer(modifier = Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Allow direct messages from server members", color = palette.textPrimary, modifier = Modifier.weight(1f))
                Switch(
                    checked = allowDms,
                    onCheckedChange = {
                        allowDms = it
                        // Persist via updateProfile or a dedicated updatePreferences
                        viewModel.updateProfile(mapOf("privacySettings" to mapOf("allowDmsFromMembers" to it)))
                    },
                    colors = SwitchDefaults.colors(checkedThumbColor = palette.accent, checkedTrackColor = palette.accent.copy(alpha = 0.5f))
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppearanceSettingsScreen(
    onBack: () -> Unit,
    currentTheme: String,
    onThemeChange: (String) -> Unit
) {
    val palette = profilePalette()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Appearance", color = palette.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
            )
        },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Text("THEME", color = palette.textTertiary, style = MaterialTheme.typography.labelMedium)
            Spacer(modifier = Modifier.height(16.dp))

            ThemeOption("System Default", "system", currentTheme, onThemeChange, palette)
            ThemeOption("Dark", "dark", currentTheme, onThemeChange, palette)
            ThemeOption("Light", "light", currentTheme, onThemeChange, palette)
        }
    }
}

@Composable
fun ThemeOption(label: String, value: String, currentValue: String, onSelect: (String) -> Unit, palette: ProfilePalette) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .clickable { onSelect(value) }
    ) {
        RadioButton(
            selected = currentValue == value,
            onClick = { onSelect(value) },
            colors = RadioButtonDefaults.colors(selectedColor = palette.accent)
        )
        Text(label, color = palette.textPrimary, modifier = Modifier.padding(start = 8.dp))
    }
}
