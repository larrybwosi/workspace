package com.scrymechat.android.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.UserEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OtherUserProfileScreen(
    userId: String,
    onBack: () -> Unit,
    onSendMessage: (String) -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val user by viewModel.targetUser.collectAsState()
    val isLoading by viewModel.isLoadingTarget.collectAsState()
    val palette = profilePalette()

    LaunchedEffect(userId) {
        viewModel.fetchUser(userId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(user?.name ?: "Profile", color = palette.textPrimary) },
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
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = palette.accent)
            }
        } else if (user != null) {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
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
                        ) {
                            user?.banner?.let { bannerUrl ->
                                AsyncImage(
                                    model = bannerUrl,
                                    contentDescription = null,
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }

                        // Avatar and Info
                        Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                            Column {
                                Spacer(modifier = Modifier.height(44.dp))
                                Text(user?.name ?: "", color = palette.textPrimary, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                                user?.username?.let { uname ->
                                    Text("@$uname", color = palette.textSecondary, fontSize = 14.sp)
                                }
                                if (user?.statusText?.isNotEmpty() == true) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(user?.statusText ?: "", color = palette.textPrimary, fontSize = 15.sp)
                                }
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            // Avatar
                            Box(
                                modifier = Modifier
                                    .offset(y = (-40).dp)
                                    .size(80.dp)
                                    .clip(CircleShape)
                                    .background(palette.cardSurface)
                                    .padding(4.dp)
                                    .clip(CircleShape)
                            ) {
                                user?.avatar?.let { avatarUrl ->
                                    AsyncImage(
                                        model = avatarUrl,
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize().clip(CircleShape)
                                    )
                                } ?: run {
                                    Box(
                                        modifier = Modifier.fillMaxSize().background(palette.accent),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text((user?.name?.firstOrNull() ?: 'U').toString(), color = Color.White, fontSize = 32.sp)
                                    }
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }

                item {
                    Button(
                        onClick = { onSendMessage(userId) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = palette.accent)
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Message, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Send Message")
                    }
                }
            }
        } else {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("User not found", color = palette.textSecondary)
            }
        }
    }
}
