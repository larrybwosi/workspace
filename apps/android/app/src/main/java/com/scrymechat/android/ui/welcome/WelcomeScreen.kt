package com.scrymechat.android.ui.welcome

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

data class WelcomePage(
    val title: String,
    val description: String,
    val color: Color
)

val welcomePages = listOf(
    WelcomePage(
        "Secure Collaboration",
        "Experience end-to-end encrypted messaging and military-grade file sharing designed for the modern enterprise. Your data stays yours, always.",
        Color(0xFF5865F2)
    ),
    WelcomePage(
        "Seamless Workflow",
        "Connect Scrymechat with your existing toolstack. Automate notifications, manage tasks, and keep your entire organization in perfect sync without breaking flow.",
        Color(0xFFF43F5E)
    ),
    WelcomePage(
        "Real-time Channels",
        "Create dedicated spaces for projects, teams, or topics. High-fidelity voice, video, and real-time messaging ensure you're never out of the loop.",
        Color(0xFF10B981)
    )
)

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun WelcomeScreen(
    onLoginClick: () -> Unit,
    onSignUpClick: () -> Unit,
    currentApiUrl: String = com.scrymechat.android.BuildConfig.API_URL,
    onApiUrlChange: (String) -> Unit = {}
) {
    val pagerState = rememberPagerState(pageCount = { welcomePages.size })
    val scope = rememberCoroutineScope()
    var showApiDialog by remember { mutableStateOf(false) }
    var tempApiUrl by remember { mutableStateOf(currentApiUrl) }

    val currentColor = welcomePages[pagerState.currentPage].color
    val animatedColor by animateColorAsState(
        targetValue = currentColor,
        animationSpec = tween(durationMillis = 1000),
        label = "backgroundColor"
    )

    if (showApiDialog) {
        AlertDialog(
            onDismissRequest = { showApiDialog = false },
            title = { Text("Change API URL") },
            text = {
                OutlinedTextField(
                    value = tempApiUrl,
                    onValueChange = { tempApiUrl = it },
                    label = { Text("API URL") },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    onApiUrlChange(tempApiUrl)
                    showApiDialog = false
                }) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showApiDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Smoky Faded Background
        SmokyBackground(animatedColor)

        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            WelcomePageView(welcomePages[page])
        }

        IconButton(
            onClick = { showApiDialog = true },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
        ) {
            Icon(
                Icons.Default.Settings,
                contentDescription = "API Settings",
                tint = Color.White
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Bottom
        ) {
            // Pager Indicators
            Row(
                Modifier
                    .height(50.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                repeat(welcomePages.size) { iteration ->
                    val color = if (pagerState.currentPage == iteration)
                        Color.White
                    else
                        Color.White.copy(alpha = 0.3f)
                    Box(
                        modifier = Modifier
                            .padding(4.dp)
                            .clip(CircleShape)
                            .background(color)
                            .size(8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            val isLastPage = pagerState.currentPage == welcomePages.size - 1

            if (isLastPage) {
                Button(
                    onClick = onSignUpClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = Color.Black
                    )
                ) {
                    Text(
                        "Get Started",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = onLoginClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.5f))
                ) {
                    Text(
                        "Sign In",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            } else {
                Button(
                    onClick = {
                        scope.launch {
                            pagerState.animateScrollToPage(pagerState.currentPage + 1)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White.copy(alpha = 0.2f),
                        contentColor = Color.White
                    )
                ) {
                    Text(
                        "Next",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }

                // Spacer to keep the layout consistent with the last page's two buttons
                Spacer(modifier = Modifier.height(68.dp))
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun SmokyBackground(color: Color) {
    val infiniteTransition = rememberInfiniteTransition(label = "smoky")
    val xOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(20000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "xOffset"
    )
    val yOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(25000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "yOffset"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        Canvas(modifier = Modifier.fillMaxSize().blur(80.dp)) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(color.copy(alpha = 0.4f), Color.Transparent),
                    center = androidx.compose.ui.geometry.Offset(xOffset, yOffset),
                    radius = 800f
                )
            )
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(color.copy(alpha = 0.3f), Color.Transparent),
                    center = androidx.compose.ui.geometry.Offset(size.width - yOffset, size.height - xOffset),
                    radius = 1000f
                )
            )
        }
    }
}

@Composable
fun WelcomePageView(page: WelcomePage) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.Start,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = page.title,
            style = MaterialTheme.typography.displayMedium.copy(
                fontWeight = FontWeight.ExtraBold,
                lineHeight = 52.sp
            ),
            textAlign = TextAlign.Start,
            color = Color.White
        )

        Spacer(modifier = Modifier.height(24.dp))

        Box(
            modifier = Modifier
                .width(60.dp)
                .height(4.dp)
                .background(Color.White.copy(alpha = 0.3f))
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = page.description,
            style = MaterialTheme.typography.bodyLarge.copy(
                fontSize = 20.sp,
                lineHeight = 30.sp,
                letterSpacing = 0.sp
            ),
            textAlign = TextAlign.Start,
            color = Color.White.copy(alpha = 0.8f)
        )

        // Add padding at the bottom to avoid overlapping with buttons
        Spacer(modifier = Modifier.height(180.dp))
    }
}
