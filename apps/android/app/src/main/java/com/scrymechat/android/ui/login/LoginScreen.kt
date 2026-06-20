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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.browser.customtabs.CustomTabsIntent

// ─── Theme-aware design tokens ─────────────────────────────────────────────
// Stripe-inspired palette: deep indigo/violet brand, soft glass surfaces,
// distinct light & dark variants rather than a single shared palette.

private data class LoginPalette(
    val isDark: Boolean,
    // Backdrop gradient
    val bgGradient: List<Color>,
    val bgMeshAccent1: Color,
    val bgMeshAccent2: Color,
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
    // Trust strip
    val trustSurfaceGradient: List<Color>,
    val trustBorder: Color,
    val trustTextPrimary: Color,
    val trustTextSecondary: Color,
)

@Composable
private fun loginPalette(isDark: Boolean): LoginPalette {
    return if (isDark) {
        LoginPalette(
            isDark = true,
            bgGradient = listOf(Color(0xFF05060A), Color(0xFF0B0E16), Color(0xFF0A0B12)),
            bgMeshAccent1 = Color(0xFF4F46E5).copy(alpha = 0.18f),
            bgMeshAccent2 = Color(0xFF7C3AED).copy(alpha = 0.14f),
            cardSurface = Color(0xFF12141C).copy(alpha = 0.72f),
            cardBorder = Color.White.copy(alpha = 0.08f),
            glassSurface = Color.White.copy(alpha = 0.04f),
            glassBorder = Color.White.copy(alpha = 0.10f),
            inputSurface = Color.White.copy(alpha = 0.04f),
            inputBorder = Color.White.copy(alpha = 0.12f),
            inputBorderFocused = Color(0xFF818CF8),
            textPrimary = Color(0xFFF8FAFC),
            textSecondary = Color(0xFFA1A8B8),
            textTertiary = Color(0xFF6B7280),
            brand = Color(0xFFFFFFFF),
            accentGradient = listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)),
            accentSoft = Color(0xFF818CF8),
            success = Color(0xFF34D399),
            error = Color(0xFFF87171),
            errorSurface = Color(0xFF7F1D1D).copy(alpha = 0.25f),
            errorBorder = Color(0xFFB91C1C).copy(alpha = 0.4f),
            trustSurfaceGradient = listOf(
                Color(0xFF1E1B4B).copy(alpha = 0.55f),
                Color(0xFF312E81).copy(alpha = 0.35f)
            ),
            trustBorder = Color(0xFF6366F1).copy(alpha = 0.25f),
            trustTextPrimary = Color(0xFFC7D2FE),
            trustTextSecondary = Color(0xFF9DA3F0),
        )
    } else {
        LoginPalette(
            isDark = false,
            bgGradient = listOf(Color(0xFFF7F8FC), Color(0xFFEEF0FB), Color(0xFFF9F8FC)),
            bgMeshAccent1 = Color(0xFF6366F1).copy(alpha = 0.10f),
            bgMeshAccent2 = Color(0xFF8B5CF6).copy(alpha = 0.08f),
            cardSurface = Color.White.copy(alpha = 0.80f),
            cardBorder = Color(0xFFE2E5F1),
            glassSurface = Color.White.copy(alpha = 0.55f),
            glassBorder = Color.White.copy(alpha = 0.9f),
            inputSurface = Color.White,
            inputBorder = Color(0xFFE2E5F1),
            inputBorderFocused = Color(0xFF6366F1),
            textPrimary = Color(0xFF0F1222),
            textSecondary = Color(0xFF5B5F73),
            textTertiary = Color(0xFF9598A8),
            brand = Color(0xFF0F1222),
            accentGradient = listOf(Color(0xFF4F46E5), Color(0xFF7C3AED)),
            accentSoft = Color(0xFF6366F1),
            success = Color(0xFF16A34A),
            error = Color(0xFFDC2626),
            errorSurface = Color(0xFFFEF2F2),
            errorBorder = Color(0xFFFECACA),
            trustSurfaceGradient = listOf(Color(0xFFEEF0FF), Color(0xFFF3EEFF)),
            trustBorder = Color(0xFFD9DBFA),
            trustTextPrimary = Color(0xFF3730A3),
            trustTextSecondary = Color(0xFF5B55C7),
        )
    }
}

private val ShapeCard   = RoundedCornerShape(20.dp)
private val ShapeInput  = RoundedCornerShape(12.dp)
private val ShapeButton = RoundedCornerShape(12.dp)
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

    var passwordVisible by remember { mutableStateOf(false) }
    var rememberMe by remember { mutableStateOf(false) }
    var emailFocused by remember { mutableStateOf(false) }
    var passwordFocused by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.isLoginSuccess) {
        if (uiState.isLoginSuccess) onLoginSuccess()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(palette.bgGradient))
    ) {
        // ── Decorative mesh-gradient blobs (Stripe-style ambient glow) ──────
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(palette.bgMeshAccent1, Color.Transparent),
                    center = Offset(size.width * 0.15f, size.height * 0.05f),
                    radius = size.width * 0.9f
                ),
                radius = size.width * 0.9f,
                center = Offset(size.width * 0.15f, size.height * 0.05f)
            )
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(palette.bgMeshAccent2, Color.Transparent),
                    center = Offset(size.width * 0.95f, size.height * 0.35f),
                    radius = size.width * 0.8f
                ),
                radius = size.width * 0.8f,
                center = Offset(size.width * 0.95f, size.height * 0.35f)
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
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

                // Organization badge (SSO hint) — glass pill
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
                            letterSpacing = 0.2.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── Brand wordmark ────────────────────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(9.dp),
                modifier = Modifier.padding(bottom = 2.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(
                            Brush.linearGradient(palette.accentGradient),
                            RoundedCornerShape(9.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "S",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp,
                        letterSpacing = (-0.5).sp
                    )
                }
                Text(
                    text = "Scrymechat",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    color = palette.textPrimary,
                    letterSpacing = (-0.3).sp
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // ── Heading block ─────────────────────────────────────────────
            Text(
                text = "Sign in to your workspace",
                fontWeight = FontWeight.Bold,
                fontSize = 26.sp,
                color = palette.textPrimary,
                letterSpacing = (-0.6).sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Use your organizational credentials to access your team workspace.",
                fontSize = 14.sp,
                color = palette.textSecondary,
                lineHeight = 20.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(0.92f)
            )

            Spacer(modifier = Modifier.height(28.dp))

            // ── Social auth row ───────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                GlassOAuthButton(
                    label = "Google",
                    palette = palette,
                    logoContent = {
                        Text(
                            text = "G",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF4285F4)
                        )
                    },
                    onClick = { /* Google Login */ },
                    modifier = Modifier.weight(1f)
                )
                GlassOAuthButton(
                    label = "GitHub",
                    palette = palette,
                    logoContent = {
                        Text(
                            text = "⌥",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = palette.textPrimary
                        )
                    },
                    onClick = {
                        val githubAuthUrl = "https://github.com/login/oauth/authorize" +
                                "?client_id=YOUR_GITHUB_CLIENT_ID" +
                                "&scope=user:email" +
                                "&redirect_uri=scrymechat://auth"
                        val customTabsIntent = CustomTabsIntent.Builder().build()
                        customTabsIntent.launchUrl(context, Uri.parse(githubAuthUrl))
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(22.dp))

            // ── Divider ───────────────────────────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                HorizontalDivider(modifier = Modifier.weight(1f), thickness = 1.dp, color = palette.cardBorder)
                Text(
                    text = "or continue with email",
                    modifier = Modifier.padding(horizontal = 14.dp),
                    fontSize = 12.sp,
                    color = palette.textTertiary,
                    letterSpacing = 0.1.sp
                )
                HorizontalDivider(modifier = Modifier.weight(1f), thickness = 1.dp, color = palette.cardBorder)
            }

            Spacer(modifier = Modifier.height(22.dp))

            // ── Form card (glass panel) ───────────────────────────────────
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = ShapeCard,
                color = palette.cardSurface,
                border = BorderStroke(1.dp, palette.cardBorder),
                shadowElevation = if (palette.isDark) 0.dp else 8.dp
            ) {
                Column(
                    modifier = Modifier.padding(22.dp)
                ) {

                    // Email field
                    PremiumFormField(label = "Work email", palette = palette) {
                        PremiumTextField(
                            value = uiState.email,
                            onValueChange = viewModel::onEmailChanged,
                            placeholder = "name@company.com",
                            keyboardType = KeyboardType.Email,
                            palette = palette,
                            onFocusChanged = { emailFocused = it },
                            isFocused = emailFocused
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Password field
                    PremiumFormField(
                        label = "Password",
                        palette = palette,
                        trailingLabel = {
                            Text(
                                text = "Forgot password?",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
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

                    Spacer(modifier = Modifier.height(16.dp))

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
                                uncheckedThumbColor = if (palette.isDark) Color(0xFF9CA3AF) else Color.White,
                                uncheckedTrackColor = if (palette.isDark) Color.White.copy(alpha = 0.12f) else palette.inputBorder,
                                uncheckedBorderColor = palette.inputBorder
                            ),
                            modifier = Modifier.scale(0.8f)
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Column {
                            Text(
                                text = "Remember this device",
                                fontSize = 13.sp,
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
                Spacer(modifier = Modifier.height(12.dp))
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

            Spacer(modifier = Modifier.height(18.dp))

            // ── Primary CTA — gradient pill, signature premium element ────
            val ctaModifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .clip(ShapeButton)
                .then(
                    if (!uiState.isLoading) Modifier.background(Brush.linearGradient(palette.accentGradient))
                    else Modifier.background(palette.accentGradient[0].copy(alpha = 0.5f))
                )

            Box(
                modifier = ctaModifier.clickable(
                    enabled = !uiState.isLoading,
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) { viewModel.login() },
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

            Spacer(modifier = Modifier.height(18.dp))

            // ── Security trust strip ───────────────────────────────────────
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = ShapeInput,
                color = Color.Transparent,
                border = BorderStroke(1.dp, palette.trustBorder)
            ) {
                Row(
                    modifier = Modifier
                        .background(Brush.horizontalGradient(palette.trustSurfaceGradient))
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
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
                        Icon(
                            imageVector = Icons.Filled.Lock,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "Enterprise-grade security",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = palette.trustTextPrimary
                        )
                        Text(
                            text = "256-bit TLS encryption · SOC 2 Type II · GDPR compliant",
                            fontSize = 11.sp,
                            color = palette.trustTextSecondary,
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── Sign up footer ─────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "New to Scrymechat? ",
                    fontSize = 14.sp,
                    color = palette.textSecondary
                )
                Text(
                    text = "Create an account",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = palette.accentSoft,
                    modifier = Modifier.clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { onSignUpClick() }
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
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
            .size(38.dp)
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
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
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
                .padding(bottom = 7.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = palette.textPrimary,
                letterSpacing = 0.1.sp
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
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
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
        modifier = modifier.height(46.dp),
        shape = ShapeButton,
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = palette.glassSurface,
            contentColor = palette.textPrimary
        ),
        border = BorderStroke(1.dp, palette.glassBorder),
        contentPadding = PaddingValues(horizontal = 14.dp),
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
