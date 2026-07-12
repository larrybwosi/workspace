package com.scrymechat.android.ui.profile.settings

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
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Edit
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
import com.scrymechat.android.ui.profile.ProfileViewModel
import com.scrymechat.android.ui.profile.profilePalette
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
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
