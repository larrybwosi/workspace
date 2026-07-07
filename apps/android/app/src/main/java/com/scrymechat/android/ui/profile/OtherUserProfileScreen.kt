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
                title = {
                    Text(
                        user?.name ?: "Profile",
                        color = palette.textPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(palette.iconChipBg),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = palette.textPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
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
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                item {
                    ProfileHeaderSection(user = user, palette = palette)
                }

                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 24.dp)
                    ) {
                        if (!user?.bio.isNullOrEmpty()) {
                            ProfileInfoSection(title = "ABOUT ME", content = user?.bio!!, palette = palette)
                            Spacer(modifier = Modifier.height(24.dp))
                        }

                        ProfileInfoSection(title = "USER INFORMATION", palette = palette) {
                            InfoRow(label = "Username", value = "@${user?.username ?: "unknown"}", palette = palette)
                            InfoRow(label = "Status", value = user?.status ?: "offline", palette = palette)
                            InfoRow(label = "Role", value = user?.role ?: "Member", palette = palette)
                        }

                        Spacer(modifier = Modifier.height(32.dp))

                        Button(
                            onClick = { onSendMessage(userId) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = palette.accent)
                        ) {
                            Icon(Icons.AutoMirrored.Filled.Message, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text("Send Message", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                        }
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

@Composable
fun ProfileHeaderSection(user: UserEntity?, palette: ProfilePalette) {
    Box(modifier = Modifier.fillMaxWidth().height(260.dp)) {
        // Banner
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .then(
                    if (user?.banner == null)
                        Modifier.background(Brush.verticalGradient(palette.headerGradient))
                    else
                        Modifier.background(Color.Transparent)
                )
        ) {
            user?.banner?.let { bannerUrl ->
                AsyncImage(
                    model = bannerUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
            // Gradient Overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color.Black.copy(alpha = 0.4f))
                        )
                    )
            )
        }

        // Avatar and Name
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 20.dp, bottom = 0.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape)
                    .background(palette.cardSurface)
                    .padding(4.dp)
                    .clip(CircleShape)
                    .border(2.dp, palette.avatarRing, CircleShape)
            ) {
                user?.avatar?.let { avatarUrl ->
                    AsyncImage(
                        model = avatarUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize().clip(CircleShape)
                    )
                } ?: run {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Brush.linearGradient(palette.accentGradient)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            (user?.name?.firstOrNull() ?: 'U').toString().uppercase(),
                            color = Color.White,
                            fontSize = 36.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                user?.name ?: "",
                color = palette.textPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp,
                letterSpacing = (-0.5).sp
            )

            if (user?.statusText?.isNotEmpty() == true) {
                Text(
                    user.statusText!!,
                    color = palette.textSecondary,
                    fontSize = 15.sp
                )
            }
        }
    }
}

@Composable
fun ProfileInfoSection(title: String, palette: ProfilePalette, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = title,
            color = palette.textTertiary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
        )
        Spacer(modifier = Modifier.height(12.dp))
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = palette.cardSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, palette.cardBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp), content = content)
        }
    }
}

@Composable
fun ProfileInfoSection(title: String, content: String, palette: ProfilePalette) {
    ProfileInfoSection(title = title, palette = palette) {
        Text(
            text = content,
            color = palette.textPrimary,
            fontSize = 15.sp,
            lineHeight = 22.sp
        )
    }
}

@Composable
fun InfoRow(label: String, value: String, palette: ProfilePalette) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = palette.textSecondary, fontSize = 14.sp)
        Text(value, color = palette.textPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
    }
}
