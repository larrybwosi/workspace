package com.scrymechat.android.ui.login

import android.net.Uri
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.browser.customtabs.CustomTabsIntent

// ─── Enterprise Design System ─────────────────────────────────────────────
//
// Aesthetic: Okta / Datadog / Snowflake — smoky near-black backdrop with
// layered steel-blue atmospheric glow, zero purple, strictly corporate blue
// accent (#2563EB / #1D4ED8).
//
// Keyboard handling:
//   • imePadding() on the root Box — the visible area shrinks above the IME
//     so no content is ever hidden behind the keyboard.
//   • systemBarsPadding() on the scrollable Column — respects status bar
//     height and the navigation bar / gesture bar at the bottom.
//   • ImeAction.Next / Done wired to focus traversal and login submission —
//     users never need to tap outside the keyboard to advance.
//
// IMPORTANT: The host Activity must call
//   WindowCompat.setDecorFitsSystemWindows(window, false)
// so the Compose layout receives the raw window insets that drive imePadding().

private data class LoginPalette(
    val isDark: Boolean,
    // Backdrop
    val bgGradient: List<Color>,
    val bgSmoke1: Color,
    val bgSmoke2: Color,
    val bgSmoke3: Color,
    // Surfaces
    val cardSurface: Color,
    val cardBorder: Color,
    val glassSurface: Color,
    val glassBorder: Color,
    val inputSurface: Color,
    val inputBorder: Color,
    val inputBorderFocused: Color,
    // Text
    val textPrimary: Color,
    val textSecondary: Color,
    val textTertiary: Color,
    // Brand / accent
    val brand: Color,
    val accentGradient: List<Color>,
    val accentSoft: Color,
    // Status
    val success: Color,
    val error: Color,
    val errorSurface: Color,
    val errorBorder: Color,
)

@Composable
private fun loginPalette(isDark: Boolean): LoginPalette = if (isDark) {
    LoginPalette(
        isDark = true,
        // Near-black with a cool charcoal-blue tint — no warm grey
        bgGradient = listOf(
            Color(0xFF06080D),
            Color(0xFF0C0F18),
            Color(0xFF070910),
        ),
        // Layered steel-blue smoke: barely visible, just adds atmospheric depth
        bgSmoke1 = Color(0xFF1E3A5F).copy(alpha = 0.18f),  // upper-left: deep navy
        bgSmoke2 = Color(0xFF0C4A6E).copy(alpha = 0.12f),  // lower-right: steel
        bgSmoke3 = Color(0xFF172554).copy(alpha = 0.10f),  // center: dark indigo-navy
        // Surfaces: dark elevation rather than glassy
        cardSurface = Color(0xFF0E1119).copy(alpha = 0.90f),
        cardBorder = Color.White.copy(alpha = 0.07f),
        glassSurface = Color.White.copy(alpha = 0.04f),
        glassBorder = Color.White.copy(alpha = 0.08f),
        inputSurface = Color(0xFF08090F),
        inputBorder = Color.White.copy(alpha = 0.09f),
        inputBorderFocused = Color(0xFF3B82F6),           // blue-500
        textPrimary = Color(0xFFDEE4F0),
        textSecondary = Color(0xFF7D8BA3),
        textTertiary = Color(0xFF44506A),
        brand = Color(0xFFDEE4F0),
        accentGradient = listOf(Color(0xFF1D4ED8), Color(0xFF2563EB)), // corporate blue
        accentSoft = Color(0xFF60A5FA),                    // blue-400
        success = Color(0xFF34D399),
        error = Color(0xFFF87171),
        errorSurface = Color(0xFF7F1D1D).copy(alpha = 0.22f),
        errorBorder = Color(0xFFB91C1C).copy(alpha = 0.38f),
    )
} else {
    LoginPalette(
        isDark = false,
        // Cool light grey — clinical, enterprise, not warm or cream
        bgGradient = listOf(
            Color(0xFFEAEDF4),
            Color(0xFFE2E6F0),
            Color(0xFFEFF1F7),
        ),
        bgSmoke1 = Color(0xFF2563EB).copy(alpha = 0.06f),
        bgSmoke2 = Color(0xFF0EA5E9).copy(alpha = 0.04f),
        bgSmoke3 = Color(0xFF1E40AF).copy(alpha = 0.03f),
        cardSurface = Color.White.copy(alpha = 0.96f),
        cardBorder = Color(0xFFD5DAE8),
        glassSurface = Color.White.copy(alpha = 0.70f),
        glassBorder = Color(0xFFC8CEDF),
        inputSurface = Color(0xFFF5F7FC),
        inputBorder = Color(0xFFCDD3E2),
        inputBorderFocused = Color(0xFF2563EB),
        textPrimary = Color(0xFF09101F),
        textSecondary = Color(0xFF48526A),
        textTertiary = Color(0xFF8892AA),
        brand = Color(0xFF09101F),
        accentGradient = listOf(Color(0xFF1D4ED8), Color(0xFF2563EB)),
        accentSoft = Color(0xFF2563EB),
        success = Color(0xFF16A34A),
        error = Color(0xFFDC2626),
        errorSurface = Color(0xFFFEF2F2),
        errorBorder = Color(0xFFFECACA),
    )
}

private val ShapeCard   = RoundedCornerShape(14.dp)
private val ShapeInput  = RoundedCornerShape(9.dp)
private val ShapeButton = RoundedCornerShape(9.dp)
private val ShapePill   = RoundedCornerShape(50)
// ──────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onBack: () -> Unit,
    onSignUpClick: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val isDark = isSystemInDarkTheme()
    val palette = loginPalette(isDark)
    val focusManager = LocalFocusManager.current

    var passwordVisible by remember { mutableStateOf(false) }
    var rememberMe by remember { mutableStateOf(false) }
    var emailFocused by remember { mutableStateOf(false) }
    var passwordFocused by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.isLoginSuccess) {
        if (uiState.isLoginSuccess) onLoginSuccess()
    }

    // Root Box: fills the full screen and shrinks its bottom edge to sit
    // above the software keyboard via imePadding(). The scrollable Column
    // inside can then scroll freely within the remaining space.
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(palette.bgGradient))
            .imePadding()
    ) {
        // ── Smoky atmospheric background blobs ────────────────────────────
        // Three subtly overlapping radial glows simulate haze / depth.
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Upper-left: main atmospheric source
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(palette.bgSmoke1, Color.Transparent),
                    center = Offset(0f, 0f),
                    radius = size.width * 1.4f
                ),
                radius = size.width * 1.4f,
                center = Offset(0f, 0f)
            )
            // Lower-right: secondary glow — creates spatial depth
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(palette.bgSmoke2, Color.Transparent),
                    center = Offset(size.width, size.height),
                    radius = size.width * 1.0f
                ),
                radius = size.width * 1.0f,
                center = Offset(size.width, size.height)
            )
            // Center-fade: ties the two glows together, avoids hard seam
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(palette.bgSmoke3, Color.Transparent),
                    center = Offset(size.width * 0.5f, size.height * 0.45f),
                    radius = size.width * 0.75f
                ),
                radius = size.width * 0.75f,
                center = Offset(size.width * 0.5f, size.height * 0.45f)
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .systemBarsPadding()  // respects status bar + nav/gesture bar
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            // ── Top navigation bar ────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                GlassIconButton(
                    icon = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    palette = palette,
                    onClick = onBack
                )

                Spacer(modifier = Modifier.weight(1f))

                // SSO status badge — enterprise users care about this
                Surface(
                    shape = ShapePill,
                    border = BorderStroke(1.dp, palette.glassBorder),
                    color = palette.glassSurface,
                    modifier = Modifier.height(30.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        PulsingDot(color = palette.success)
                        Text(
                            text = "SSO Available",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = palette.textSecondary,
                            letterSpacing = 0.3.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            // ── Brand wordmark ────────────────────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(9.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .background(
                            Brush.linearGradient(palette.accentGradient),
                            RoundedCornerShape(8.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "S",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp,
                        letterSpacing = (-0.5).sp
                    )
                }
                Text(
                    text = "Scrymechat",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    color = palette.textPrimary,
                    letterSpacing = (-0.2).sp
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── Heading block ─────────────────────────────────────────────
            Text(
                text = "Sign in to your workspace",
                fontWeight = FontWeight.Bold,
                fontSize = 23.sp,
                color = palette.textPrimary,
                letterSpacing = (-0.5).sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(7.dp))
            Text(
                text = "Use your organizational credentials to access your team workspace.",
                fontSize = 13.sp,
                color = palette.textSecondary,
                lineHeight = 19.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(0.88f)
            )

            Spacer(modifier = Modifier.height(22.dp))

            // ── Social auth row ───────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                GlassOAuthButton(
                    label = "Google",
                    palette = palette,
                    logoContent = {
                        Text("G", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF4285F4))
                    },
                    onClick = { /* Google OAuth */ },
                    modifier = Modifier.weight(1f)
                )
                GlassOAuthButton(
                    label = "GitHub",
                    palette = palette,
                    logoContent = {
                        Text("⌥", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = palette.textPrimary)
                    },
                    onClick = {
                        val url = "https://github.com/login/oauth/authorize" +
                                "?client_id=YOUR_GITHUB_CLIENT_ID" +
                                "&scope=user:email" +
                                "&redirect_uri=scrymechat://auth"
                        CustomTabsIntent.Builder().build().launchUrl(context, Uri.parse(url))
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            // ── Divider ───────────────────────────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                HorizontalDivider(modifier = Modifier.weight(1f), thickness = 1.dp, color = palette.cardBorder)
                Text(
                    text = "or continue with email",
                    modifier = Modifier.padding(horizontal = 14.dp),
                    fontSize = 11.sp,
                    color = palette.textTertiary,
                    letterSpacing = 0.2.sp
                )
                HorizontalDivider(modifier = Modifier.weight(1f), thickness = 1.dp, color = palette.cardBorder)
            }

            Spacer(modifier = Modifier.height(18.dp))

            // ── Form card ─────────────────────────────────────────────────
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = ShapeCard,
                color = palette.cardSurface,
                border = BorderStroke(1.dp, palette.cardBorder),
                shadowElevation = if (palette.isDark) 0.dp else 4.dp
            ) {
                Column(modifier = Modifier.padding(horizontal = 18.dp, vertical = 20.dp)) {

                    // Email field — ImeAction.Next moves focus to password
                    PremiumFormField(label = "Work email", palette = palette) {
                        PremiumTextField(
                            value = uiState.email,
                            onValueChange = viewModel::onEmailChanged,
                            placeholder = "name@company.com",
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Next,
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            palette = palette,
                            onFocusChanged = { emailFocused = it },
                            isFocused = emailFocused
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Password field — ImeAction.Done triggers login directly
                    PremiumFormField(
                        label = "Password",
                        palette = palette,
                        trailingLabel = {
                            Text(
                                text = "Forgot password?",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = palette.accentSoft,
                                modifier = Modifier.clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) { /* Forgot Password */ }
                            )
                        }
                    ) {
                        PremiumTextField(
                            value = uiState.password,
                            onValueChange = viewModel::onPasswordChanged,
                            placeholder = "Enter your password",
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done,
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    focusManager.clearFocus()
                                    viewModel.login()
                                }
                            ),
                            palette = palette,
                            onFocusChanged = { passwordFocused = it },
                            isFocused = passwordFocused,
                            trailingIcon = {
                                IconButton(
                                    onClick = { passwordVisible = !passwordVisible },
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Icon(
                                        imageVector = if (passwordVisible) Icons.Filled.Visibility
                                        else Icons.Filled.VisibilityOff,
                                        contentDescription = if (passwordVisible) "Hide password" else "Show password",
                                        tint = palette.textTertiary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            },
                            visualTransformation = if (passwordVisible) VisualTransformation.None
                            else PasswordVisualTransformation()
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Remember device row
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Switch(
                            checked = rememberMe,
                            onCheckedChange = { rememberMe = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = palette.accentSoft,
                                uncheckedThumbColor = if (palette.isDark) Color(0xFF6B7280) else Color.White,
                                uncheckedTrackColor = if (palette.isDark) Color.White.copy(alpha = 0.10f) else palette.inputBorder,
                                uncheckedBorderColor = palette.inputBorder
                            ),
                            modifier = Modifier.scale(0.78f)
                        )
                        Spacer(modifier = Modifier.width(0.dp))
                        Column {
                            Text(
                                text = "Remember this device",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = palette.textPrimary
                            )
                            Text(
                                text = "Stay signed in for 30 days",
                                fontSize = 11.sp,
                                color = palette.textSecondary
                            )
                        }
                    }
                }
            }

            // ── Inline error ──────────────────────────────────────────────
            if (uiState.error != null) {
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = ShapeInput,
                    color = palette.errorSurface,
                    border = BorderStroke(1.dp, palette.errorBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "⚠", fontSize = 13.sp, color = palette.error)
                        Text(
                            text = uiState.error!!,
                            color = palette.error,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // ── Primary CTA ───────────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(ShapeButton)
                    .then(
                        if (!uiState.isLoading)
                            Modifier.background(Brush.linearGradient(palette.accentGradient))
                        else
                            Modifier.background(palette.accentGradient[0].copy(alpha = 0.40f))
                    )
                    .clickable(
                        enabled = !uiState.isLoading,
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {
                        focusManager.clearFocus()
                        viewModel.login()
                    },
                contentAlignment = Alignment.Center
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        text = "Sign in",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp,
                        color = Color.White,
                        letterSpacing = 0.1.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            // ── Sign-up footer ────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "New to Scrymechat? ",
                    fontSize = 13.sp,
                    color = palette.textSecondary
                )
                Text(
                    text = "Create an account",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = palette.accentSoft,
                    modifier = Modifier.clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { onSignUpClick() }
                )
            }

            Spacer(modifier = Modifier.height(28.dp))
        }
    }
}

// ─── Reusable components ────────────────────────────────────────────────────

@Composable
private fun GlassIconButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    contentDescription: String,
    palette: LoginPalette,
    onClick: () -> Unit
) {
    IconButton(
        onClick = onClick,
        modifier = Modifier
            .size(36.dp)
            .border(1.dp, palette.glassBorder, ShapePill)
            .background(palette.glassSurface, ShapePill)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = palette.textPrimary,
            modifier = Modifier.size(16.dp)
        )
    }
}

@Composable
private fun PulsingDot(color: Color) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )
    Box(
        modifier = Modifier
            .size(6.dp)
            .background(color.copy(alpha = alpha), RoundedCornerShape(50))
    )
}

@Composable
private fun PremiumFormField(
    label: String,
    palette: LoginPalette,
    trailingLabel: (@Composable () -> Unit)? = null,
    content: @Composable () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = palette.textSecondary,
                letterSpacing = 0.3.sp
            )
            trailingLabel?.invoke()
        }
        content()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PremiumTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    palette: LoginPalette,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    trailingIcon: (@Composable () -> Unit)? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    isFocused: Boolean = false,
    onFocusChanged: (Boolean) -> Unit = {}
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = {
            Text(
                text = placeholder,
                color = palette.textTertiary,
                fontSize = 14.sp
            )
        },
        modifier = Modifier
            .fillMaxWidth()
            .height(50.dp)
            .onFocusChanged { onFocusChanged(it.isFocused) },
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboardType,
            imeAction = imeAction
        ),
        keyboardActions = keyboardActions,
        singleLine = true,
        shape = ShapeInput,
        visualTransformation = visualTransformation,
        trailingIcon = trailingIcon,
        textStyle = LocalTextStyle.current.copy(
            fontSize = 14.sp,
            color = palette.textPrimary
        ),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = palette.inputBorderFocused,
            unfocusedBorderColor = palette.inputBorder,
            focusedContainerColor = palette.inputSurface,
            unfocusedContainerColor = palette.inputSurface,
            cursorColor = palette.accentSoft,
            focusedTextColor = palette.textPrimary,
            unfocusedTextColor = palette.textPrimary
        )
    )
}

@Composable
private fun GlassOAuthButton(
    label: String,
    palette: LoginPalette,
    logoContent: @Composable () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(44.dp),
        shape = ShapeButton,
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = palette.glassSurface,
            contentColor = palette.textPrimary
        ),
        border = BorderStroke(1.dp, palette.glassBorder),
        contentPadding = PaddingValues(horizontal = 12.dp),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(7.dp)
        ) {
            logoContent()
            Text(
                text = label,
                fontWeight = FontWeight.Medium,
                fontSize = 13.sp,
                letterSpacing = 0.1.sp,
                color = palette.textPrimary
            )
        }
    }
}
