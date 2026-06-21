package com.scrymechat.android.ui.login

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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

// ─── Design tokens ────────────────────────────────────────────────────────────
private val ColorBrand       = Color(0xFF0F172A) // Slate-900
private val ColorAccent      = Color(0xFF4F46E5) // Indigo-600 — enterprise CTA
private val ColorSurface     = Color(0xFFF8FAFC) // Slate-50
private val ColorBorder      = Color(0xFFE2E8F0) // Slate-200
private val ColorMuted       = Color(0xFF64748B) // Slate-500
private val ColorMutedLight  = Color(0xFF94A3B8) // Slate-400
private val ColorError       = Color(0xFFDC2626) // Red-600
private val ColorSuccess     = Color(0xFF16A34A) // Green-600

private val ShapeCard        = RoundedCornerShape(8.dp)
private val ShapeInput       = RoundedCornerShape(6.dp)
private val ShapeButton      = RoundedCornerShape(6.dp)
private val ShapePill        = RoundedCornerShape(4.dp)
// ──────────────────────────────────────────────────────────────────────────────

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
    var passwordVisible by remember { mutableStateOf(false) }
    var rememberMe by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.isLoginSuccess) {
        if (uiState.isLoginSuccess) onLoginSuccess()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorSurface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            // ── Top navigation bar ────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier
                        .size(36.dp)
                        .border(1.dp, ColorBorder, ShapePill)
                        .background(Color.White, ShapePill)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = ColorBrand,
                        modifier = Modifier.size(16.dp)
                    )
                }

                Spacer(modifier = Modifier.weight(1f))

                // Organization badge (SSO hint)
                Surface(
                    shape = ShapePill,
                    border = BorderStroke(1.dp, ColorBorder),
                    color = Color.White,
                    modifier = Modifier.height(28.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(ColorSuccess, RoundedCornerShape(50))
                        )
                        Text(
                            text = "SSO Available",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = ColorMuted,
                            letterSpacing = 0.2.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // ── Brand wordmark ────────────────────────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 2.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .background(ColorBrand, RoundedCornerShape(6.dp)),
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
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = ColorBrand,
                    letterSpacing = (-0.3).sp
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── Heading block ─────────────────────────────────────────────────
            Text(
                text = "Sign in to your workspace",
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp,
                color = ColorBrand,
                letterSpacing = (-0.5).sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Use your organizational credentials to access your team workspace.",
                fontSize = 14.sp,
                color = ColorMuted,
                lineHeight = 20.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(28.dp))

            // ── Social auth row ───────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                EnterpriseOAuthButton(
                    label = "Google",
                    logoContent = {
                        // Google "G" logotype approximation
                        Text(
                            text = "G",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = Color(0xFF4285F4)
                        )
                    },
                    onClick = { /* Google Login */ },
                    modifier = Modifier.weight(1f)
                )
                EnterpriseOAuthButton(
                    label = "GitHub",
                    logoContent = {
                        Text(
                            text = "⌥",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = ColorBrand
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

            Spacer(modifier = Modifier.height(20.dp))

            // ── Divider ───────────────────────────────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                HorizontalDivider(modifier = Modifier.weight(1f), thickness = 1.dp, color = ColorBorder)
                Text(
                    text = "or continue with email",
                    modifier = Modifier.padding(horizontal = 14.dp),
                    fontSize = 12.sp,
                    color = ColorMutedLight,
                    letterSpacing = 0.1.sp
                )
                HorizontalDivider(modifier = Modifier.weight(1f), thickness = 1.dp, color = ColorBorder)
            }

            Spacer(modifier = Modifier.height(20.dp))

            // ── Form card ─────────────────────────────────────────────────────
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = ShapeCard,
                color = Color.White,
                border = BorderStroke(1.dp, ColorBorder),
                shadowElevation = 0.dp
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(0.dp)
                ) {

                    // Email field
                    EnterpriseFormField(label = "Work email") {
                        EnterpriseTextField(
                            value = uiState.email,
                            onValueChange = viewModel::onEmailChanged,
                            placeholder = "name@company.com",
                            keyboardType = KeyboardType.Email
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Password field
                    EnterpriseFormField(
                        label = "Password",
                        trailingLabel = {
                            Text(
                                text = "Forgot password?",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = ColorAccent,
                                modifier = Modifier.clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) { /* Forgot Password */ }
                            )
                        }
                    ) {
                        EnterpriseTextField(
                            value = uiState.password,
                            onValueChange = viewModel::onPasswordChanged,
                            placeholder = "Enter your password",
                            keyboardType = KeyboardType.Password,
                            trailingIcon = {
                                IconButton(
                                    onClick = { passwordVisible = !passwordVisible },
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Icon(
                                        imageVector = if (passwordVisible) Icons.Filled.Visibility
                                        else Icons.Filled.VisibilityOff,
                                        contentDescription = if (passwordVisible) "Hide password" else "Show password",
                                        tint = ColorMuted,
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
                                checkedTrackColor = ColorAccent,
                                uncheckedThumbColor = Color.White,
                                uncheckedTrackColor = ColorBorder,
                                uncheckedBorderColor = ColorBorder
                            ),
                            modifier = Modifier.scale(0.8f)
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Column {
                            Text(
                                text = "Remember this device",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = ColorBrand
                            )
                            Text(
                                text = "Stay signed in for 30 days",
                                fontSize = 11.sp,
                                color = ColorMuted
                            )
                        }
                    }
                }
            }

            // ── Inline error ──────────────────────────────────────────────────
            if (uiState.error != null) {
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = ShapeInput,
                    color = Color(0xFFFEF2F2),
                    border = BorderStroke(1.dp, Color(0xFFFECACA))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "⚠", fontSize = 13.sp, color = ColorError)
                        Text(
                            text = uiState.error!!,
                            color = ColorError,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // ── Primary CTA ───────────────────────────────────────────────────
            Button(
                onClick = viewModel::login,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                enabled = !uiState.isLoading,
                shape = ShapeButton,
                colors = ButtonDefaults.buttonColors(
                    containerColor = ColorAccent,
                    disabledContainerColor = Color(0xFFC7D2FE)
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        text = "Sign in",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        letterSpacing = 0.1.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // ── Security trust strip (signature element) ──────────────────────
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = ShapeInput,
                color = Color(0xFFF0F9FF), // Sky-50
                border = BorderStroke(1.dp, Color(0xFFBAE6FD)) // Sky-200
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Thin indigo left accent rule
                    Box(
                        modifier = Modifier
                            .width(3.dp)
                            .height(28.dp)
                            .background(ColorAccent, RoundedCornerShape(2.dp))
                    )
                    Icon(
                        imageVector = Icons.Filled.Lock,
                        contentDescription = null,
                        tint = ColorAccent,
                        modifier = Modifier.size(14.dp)
                    )
                    Column {
                        Text(
                            text = "Enterprise-grade security",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF0369A1) // Sky-700
                        )
                        Text(
                            text = "256-bit TLS encryption · SOC 2 Type II · GDPR compliant",
                            fontSize = 11.sp,
                            color = Color(0xFF0284C7), // Sky-600
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ── Sign up footer ────────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "New to Scrymechat? ",
                    fontSize = 14.sp,
                    color = ColorMuted
                )
                Text(
                    text = "Create an account",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = ColorAccent,
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

// ─── Reusable components ───────────────────────────────────────────────────────

@Composable
private fun EnterpriseFormField(
    label: String,
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
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = ColorBrand,
                letterSpacing = 0.1.sp
            )
            trailingLabel?.invoke()
        }
        content()
    }
}

@Composable
private fun EnterpriseTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    trailingIcon: (@Composable () -> Unit)? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = {
            Text(
                text = placeholder,
                color = ColorMutedLight,
                fontSize = 14.sp
            )
        },
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        singleLine = true,
        shape = ShapeInput,
        visualTransformation = visualTransformation,
        trailingIcon = trailingIcon,
        textStyle = LocalTextStyle.current.copy(
            fontSize = 14.sp,
            color = ColorBrand
        ),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = ColorAccent,
            unfocusedBorderColor = ColorBorder,
            focusedContainerColor = Color.White,
            unfocusedContainerColor = Color.White,
            cursorColor = ColorAccent
        )
    )
}

@Composable
private fun EnterpriseOAuthButton(
    label: String,
    logoContent: @Composable () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(44.dp),
        shape = ShapeButton,
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = Color.White,
            contentColor = ColorBrand
        ),
        border = BorderStroke(1.dp, ColorBorder),
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
                color = ColorBrand
            )
        }
    }
}

// Simple modifier extension for compact switch sizing
private fun Modifier.scale(scale: Float): Modifier = this.then(
    androidx.compose.ui.draw.scale(scale)
)
