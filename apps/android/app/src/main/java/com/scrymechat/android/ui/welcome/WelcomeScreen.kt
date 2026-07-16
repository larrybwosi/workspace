package com.scrymechat.android.ui.welcome

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

// ─── Data ───────────────────────────────────────────────────────────────────

data class WelcomePage(
    val eyebrow: String,
    val title: String,
    val description: String,
    val accentColor: Color
)

val welcomePages = listOf(
    WelcomePage(
        eyebrow = "01 — Privacy",
        title = "Secure\nCollaboration",
        description = "End-to-end encryption and military-grade file transfer protect every conversation. Your data remains yours — no exceptions.",
        accentColor = Color(0xFF6366F1)   // indigo
    ),
    WelcomePage(
        eyebrow = "02 — Productivity",
        title = "Seamless\nWorkflow",
        description = "Connect your existing toolstack without friction. Automate notifications, delegate tasks, and keep your organisation moving in perfect sync.",
        accentColor = Color(0xFF8B5CF6)   // violet
    ),
    WelcomePage(
        eyebrow = "03 — Communication",
        title = "Real-time\nChannels",
        description = "Dedicated spaces for every project and team. Crystal-clear voice, video, and instant messaging keep you connected when it matters most.",
        accentColor = Color(0xFF0EA5E9)   // sky blue
    )
)

// ─── Colours ─────────────────────────────────────────────────────────────────

private val Background      = Color(0xFF09090B)   // near-black
private val SurfaceMid      = Color(0xFF0F172A)   // deep navy
private val SurfaceLight    = Color(0xFF1E293B)   // slate
private val OnSurface       = Color.White
private val OnSurfaceMuted  = Color.White.copy(alpha = 0.45f)
private val Divider         = Color.White.copy(alpha = 0.10f)

// ─── Screen ──────────────────────────────────────────────────────────────────

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun WelcomeScreen(
    onLoginClick: () -> Unit,
    onSignUpClick: () -> Unit,
    currentApiUrl: String = com.scrymechat.android.BuildConfig.API_URL,
    onApiUrlChange: (String) -> Unit = {}
) {
    val pagerState   = rememberPagerState(pageCount = { welcomePages.size })
    val scope        = rememberCoroutineScope()
    var showApiDialog  by remember { mutableStateOf(false) }
    var tempApiUrl     by remember { mutableStateOf(currentApiUrl) }
    val isLastPage     = pagerState.currentPage == welcomePages.size - 1

    val currentAccent = welcomePages[pagerState.currentPage].accentColor
    val animatedAccent by animateColorAsState(
        targetValue = currentAccent,
        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        label = "accent"
    )

    if (showApiDialog) {
        ApiUrlDialog(
            current = tempApiUrl,
            onValueChange = { tempApiUrl = it },
            onSave = {
                onApiUrlChange(tempApiUrl)
                showApiDialog = false
            },
            onDismiss = { showApiDialog = false }
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {

        // ── Layered gradient background ──────────────────────────────────────
        MeshBackground(accentColor = animatedAccent)

        // ── Subtle top vignette ──────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Background.copy(alpha = 0.7f), Color.Transparent)
                    )
                )
        )

        // ── Content pager ────────────────────────────────────────────────────
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            PageContent(welcomePages[page])
        }

        // ── Settings icon ────────────────────────────────────────────────────
        IconButton(
            onClick = { showApiDialog = true },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .statusBarsPadding()
                .padding(12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "API Settings",
                tint = OnSurfaceMuted,
                modifier = Modifier.size(20.dp)
            )
        }

        // ── Bottom chrome ────────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Background.copy(alpha = 0.95f)),
                        startY = 0f,
                        endY = 120f
                    )
                )
                .navigationBarsPadding()
                .padding(horizontal = 24.dp)
                .padding(bottom = 40.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            // Page indicator strip
            PageIndicatorStrip(
                count       = welcomePages.size,
                current     = pagerState.currentPage,
                accentColor = animatedAccent
            )

            Spacer(modifier = Modifier.height(32.dp))

            if (isLastPage) {
                // Primary CTA
                Button(
                    onClick = onSignUpClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = OnSurface,
                        contentColor   = Background
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
                ) {
                    Text(
                        text  = "Create an Account",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight   = FontWeight.SemiBold,
                            letterSpacing = 0.5.sp
                        )
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Secondary CTA
                OutlinedButton(
                    onClick = onLoginClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape  = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = OnSurface),
                    border = BorderStroke(1.dp, Divider)
                ) {
                    Text(
                        text  = "Sign In",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight    = FontWeight.Medium,
                            letterSpacing = 0.5.sp
                        )
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
                        .height(52.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = OnSurface.copy(alpha = 0.08f),
                        contentColor   = OnSurface
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
                ) {
                    Text(
                        text  = "Continue",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight    = FontWeight.Medium,
                            letterSpacing = 0.5.sp
                        )
                    )
                }

                // Phantom spacer to keep layout height identical to last page
                Spacer(modifier = Modifier.height(64.dp))
            }
        }
    }
}

// ─── Animated mesh background ─────────────────────────────────────────────────
//
// Two slow-drifting diagonal gradient layers that blend with the accent colour,
// keeping the canvas deliberately dark so text is always legible.

@Composable
fun MeshBackground(accentColor: Color) {
    val infinite = rememberInfiniteTransition(label = "mesh")

    // Slow rotation-like shift, 0 → 1 over 18 s, then reverses
    val shift by infinite.animateFloat(
        initialValue = 0f,
        targetValue  = 1f,
        animationSpec = infiniteRepeatable(
            animation  = tween(18_000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shift"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .drawBehind {
                val w = size.width
                val h = size.height

                // Layer 1 — anchored top-left, drifts gently right-down
                drawRect(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            accentColor.copy(alpha = 0.18f),
                            Color.Transparent
                        ),
                        center = androidx.compose.ui.geometry.Offset(
                            x = w * (0.15f + shift * 0.25f),
                            y = h * (0.10f + shift * 0.20f)
                        ),
                        radius = w * 0.85f,
                        tileMode = TileMode.Clamp
                    )
                )

                // Layer 2 — anchored bottom-right, drifts in opposite direction
                drawRect(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            accentColor.copy(alpha = 0.12f),
                            Color.Transparent
                        ),
                        center = androidx.compose.ui.geometry.Offset(
                            x = w * (0.90f - shift * 0.30f),
                            y = h * (0.85f - shift * 0.25f)
                        ),
                        radius = w * 0.75f,
                        tileMode = TileMode.Clamp
                    )
                )

                // Layer 3 — mid-screen diagonal band for depth
                drawRect(
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Color.Transparent,
                            SurfaceMid.copy(alpha = 0.55f),
                            Color.Transparent
                        ),
                        start = androidx.compose.ui.geometry.Offset(
                            x = w * (0.0f + shift * 0.3f),
                            y = h * 0.3f
                        ),
                        end = androidx.compose.ui.geometry.Offset(
                            x = w * (1.0f - shift * 0.3f),
                            y = h * 0.7f
                        )
                    )
                )
            }
    )
}

// ─── Page content ─────────────────────────────────────────────────────────────

@Composable
fun PageContent(page: WelcomePage) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(horizontal = 28.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.Start
    ) {
        // Premium Brand Logo
        Icon(
            painter = androidx.compose.ui.res.painterResource(id = com.scrymechat.android.R.drawable.ic_logo),
            contentDescription = "Scrymechat Logo",
            tint = Color.Unspecified,
            modifier = Modifier.size(64.dp)
        )
        Spacer(modifier = Modifier.height(24.dp))
        // Eyebrow label
        Text(
            text  = page.eyebrow,
            style = MaterialTheme.typography.labelSmall.copy(
                color         = OnSurfaceMuted,
                letterSpacing = 2.sp,
                fontWeight    = FontWeight.Medium
            )
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Headline
        Text(
            text  = page.title,
            style = MaterialTheme.typography.displaySmall.copy(
                color         = OnSurface,
                fontWeight    = FontWeight.Bold,
                lineHeight    = 46.sp,
                letterSpacing = (-0.5).sp
            )
        )

        Spacer(modifier = Modifier.height(28.dp))

        // Thin rule
        HorizontalDivider(
            modifier  = Modifier.width(40.dp),
            thickness = 1.dp,
            color     = page.accentColor.copy(alpha = 0.8f)
        )

        Spacer(modifier = Modifier.height(28.dp))

        // Body copy
        Text(
            text  = page.description,
            style = MaterialTheme.typography.bodyLarge.copy(
                color         = OnSurface.copy(alpha = 0.65f),
                lineHeight    = 28.sp,
                letterSpacing = 0.1.sp
            )
        )

        // Bottom breathing room so text clears the button chrome
        Spacer(modifier = Modifier.height(200.dp))
    }
}

// ─── Page indicator strip ─────────────────────────────────────────────────────
//
// Replaces the dot carousel with a minimal segmented bar — cleaner, more editorial.

@Composable
fun PageIndicatorStrip(
    count: Int,
    current: Int,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(count) { index ->
            val isActive = index == current
            val animatedWidth by animateDpAsState(
                targetValue    = if (isActive) 28.dp else 16.dp,
                animationSpec  = tween(300, easing = FastOutSlowInEasing),
                label          = "segWidth"
            )
            val segColor by animateColorAsState(
                targetValue   = if (isActive) accentColor else OnSurface.copy(alpha = 0.18f),
                animationSpec = tween(300),
                label         = "segColor"
            )
            Box(
                modifier = Modifier
                    .height(3.dp)
                    .width(animatedWidth)
                    .clip(RoundedCornerShape(2.dp))
                    .background(segColor)
            )
        }
    }
}

// ─── API URL dialog ───────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApiUrlDialog(
    current: String,
    onValueChange: (String) -> Unit,
    onSave: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text  = "API Endpoint",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
            )
        },
        text = {
            OutlinedTextField(
                value         = current,
                onValueChange = onValueChange,
                label         = { Text("URL") },
                singleLine    = true,
                modifier      = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            TextButton(onClick = onSave) { Text("Save") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        },
        containerColor = SurfaceMid,
        titleContentColor  = OnSurface,
        textContentColor   = OnSurface
    )
}
