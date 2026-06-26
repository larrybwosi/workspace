package com.scrymechat.android.ui.signup

import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.ClickableText
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scrymechat.android.R
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SignUpScreen(
    onSignUpSuccess: () -> Unit,
    onBack: () -> Unit,
    onSignInClick: () -> Unit,
    viewModel: SignUpViewModel = hiltViewModel()
) {
    val uiState              by viewModel.uiState.collectAsState()
    val context              = LocalContext.current
    val scope                = rememberCoroutineScope()
    var passwordVisible      by remember { mutableStateOf(false) }
    var confirmVisible       by remember { mutableStateOf(false) }
    var confirmPassword      by remember { mutableStateOf("") }
    var agreedToTerms        by remember { mutableStateOf(false) }

    val sheetState           = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var showSuccessSheet     by remember { mutableStateOf(false) }

    val colorScheme = MaterialTheme.colorScheme
    val accentColor = colorScheme.primary

    val passwordMismatch = confirmPassword.isNotEmpty() && confirmPassword != uiState.password

    LaunchedEffect(uiState.isSignUpSuccess) {
        if (uiState.isSignUpSuccess) showSuccessSheet = true
    }

    Scaffold(
        containerColor = colorScheme.background,
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier
                            .padding(start = 8.dp)
                            .size(40.dp)
                            .border(
                                width = 1.dp,
                                color = colorScheme.outlineVariant,
                                shape = RoundedCornerShape(10.dp)
                            )
                    ) {
                        Icon(
                            imageVector        = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint               = colorScheme.onSurface,
                            modifier           = Modifier.size(18.dp)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colorScheme.background
                )
            )
        }
    ) { padding ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.Start
        ) {
            Spacer(modifier = Modifier.height(4.dp))

            // ── Header ────────────────────────────────────────────────────────
            Text(
                text  = "Create Account",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight    = FontWeight.Bold,
                    letterSpacing = (-0.3).sp
                ),
                color = colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text  = "Sign up to get started",
                style = MaterialTheme.typography.bodyMedium,
                color = colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(28.dp))

            // ── Full Name ─────────────────────────────────────────────────────
            FieldLabel("Full Name")
            Spacer(modifier = Modifier.height(6.dp))
            ProTextField(
                value         = uiState.name,
                onValueChange = viewModel::onNameChanged,
                placeholder   = "John Doe",
                keyboardType  = KeyboardType.Text,
                leadingIcon   = {
                    Icon(
                        imageVector        = Icons.Default.Person,
                        contentDescription = null,
                        tint               = colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                        modifier           = Modifier.size(18.dp)
                    )
                }
            )

            Spacer(modifier = Modifier.height(14.dp))

            // ── Username ──────────────────────────────────────────────────────
            FieldLabel("Username")
            Spacer(modifier = Modifier.height(6.dp))
            ProTextField(
                value         = uiState.username,
                onValueChange = viewModel::onUsernameChanged,
                placeholder   = "johndoe",
                keyboardType  = KeyboardType.Text,
                leadingIcon   = {
                    Icon(
                        imageVector        = Icons.Default.Person,
                        contentDescription = null,
                        tint               = colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                        modifier           = Modifier.size(18.dp)
                    )
                }
            )

            Spacer(modifier = Modifier.height(14.dp))

            // ── Email ─────────────────────────────────────────────────────────
            FieldLabel("Email Address")
            Spacer(modifier = Modifier.height(6.dp))
            ProTextField(
                value         = uiState.email,
                onValueChange = viewModel::onEmailChanged,
                placeholder   = "john@example.com",
                keyboardType  = KeyboardType.Email,
                leadingIcon   = {
                    Icon(
                        imageVector        = Icons.Default.Email,
                        contentDescription = null,
                        tint               = colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                        modifier           = Modifier.size(18.dp)
                    )
                }
            )

            Spacer(modifier = Modifier.height(14.dp))

            // ── Password ──────────────────────────────────────────────────────
            FieldLabel("Password")
            Spacer(modifier = Modifier.height(6.dp))
            ProTextField(
                value                = uiState.password,
                onValueChange        = viewModel::onPasswordChanged,
                placeholder          = "••••••••",
                keyboardType         = KeyboardType.Password,
                visualTransformation = if (passwordVisible) VisualTransformation.None
                                       else PasswordVisualTransformation(),
                trailingIcon         = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector        = if (passwordVisible) Icons.Filled.Visibility
                                                 else Icons.Filled.VisibilityOff,
                            contentDescription = if (passwordVisible) "Hide" else "Show",
                            tint               = colorScheme.onSurfaceVariant,
                            modifier           = Modifier.size(18.dp)
                        )
                    }
                }
            )

            Spacer(modifier = Modifier.height(14.dp))

            // ── Confirm Password ──────────────────────────────────────────────
            FieldLabel("Confirm Password")
            Spacer(modifier = Modifier.height(6.dp))
            ProTextField(
                value                = confirmPassword,
                onValueChange        = { confirmPassword = it },
                placeholder          = "••••••••",
                keyboardType         = KeyboardType.Password,
                isError              = passwordMismatch,
                visualTransformation = if (confirmVisible) VisualTransformation.None
                                       else PasswordVisualTransformation(),
                trailingIcon         = {
                    IconButton(onClick = { confirmVisible = !confirmVisible }) {
                        Icon(
                            imageVector        = if (confirmVisible) Icons.Filled.Visibility
                                                 else Icons.Filled.VisibilityOff,
                            contentDescription = if (confirmVisible) "Hide" else "Show",
                            tint               = colorScheme.onSurfaceVariant,
                            modifier           = Modifier.size(18.dp)
                        )
                    }
                }
            )

            AnimatedVisibility(visible = passwordMismatch) {
                Text(
                    text     = "Passwords do not match",
                    color    = colorScheme.error,
                    style    = MaterialTheme.typography.labelSmall,
                    modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // ── Terms checkbox ────────────────────────────────────────────────
            Row(
                verticalAlignment = Alignment.Top,
                modifier          = Modifier.fillMaxWidth()
            ) {
                Checkbox(
                    checked         = agreedToTerms,
                    onCheckedChange = { agreedToTerms = it },
                    modifier        = Modifier.size(20.dp).padding(0.dp),
                    colors          = CheckboxDefaults.colors(
                        checkedColor     = accentColor,
                        checkmarkColor   = colorScheme.onPrimary,
                        uncheckedColor   = colorScheme.outlineVariant
                    )
                )
                Spacer(modifier = Modifier.width(10.dp))
                val termsText = buildAnnotatedString {
                    withStyle(SpanStyle(color = colorScheme.onSurfaceVariant)) {
                        append("I agree to the ")
                    }
                    withStyle(SpanStyle(color = accentColor, fontWeight = FontWeight.Medium)) {
                        append("Terms of Service")
                    }
                    withStyle(SpanStyle(color = colorScheme.onSurfaceVariant)) {
                        append(" and ")
                    }
                    withStyle(SpanStyle(color = accentColor, fontWeight = FontWeight.Medium)) {
                        append("Privacy Policy")
                    }
                }
                ClickableText(
                    text    = termsText,
                    style   = MaterialTheme.typography.bodySmall.copy(lineHeight = 20.sp),
                    onClick = { /* open terms */ }
                )
            }

            // ── Inline API error ──────────────────────────────────────────────
            AnimatedVisibility(visible = uiState.error != null) {
                uiState.error?.let { msg ->
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(colorScheme.errorContainer.copy(alpha = 0.18f))
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                    ) {
                        Text(
                            text  = msg,
                            color = colorScheme.error,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ── Primary CTA ───────────────────────────────────────────────────
            Button(
                onClick  = viewModel::signUp,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                enabled  = !uiState.isLoading && agreedToTerms &&
                           confirmPassword == uiState.password && confirmPassword.isNotEmpty(),
                shape    = RoundedCornerShape(12.dp),
                colors   = ButtonDefaults.buttonColors(
                    containerColor         = accentColor,
                    contentColor           = colorScheme.onPrimary,
                    disabledContainerColor = accentColor.copy(alpha = 0.38f),
                    disabledContentColor   = colorScheme.onPrimary.copy(alpha = 0.5f)
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
            ) {
                AnimatedContent(
                    targetState  = uiState.isLoading,
                    transitionSpec = { fadeIn() togetherWith fadeOut() },
                    label        = "cta"
                ) { loading ->
                    if (loading) {
                        CircularProgressIndicator(
                            modifier    = Modifier.size(20.dp),
                            color       = colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text          = "Create Account",
                            fontWeight    = FontWeight.SemiBold,
                            fontSize      = 14.sp,
                            letterSpacing = 0.3.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ── Or divider ────────────────────────────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier          = Modifier.fillMaxWidth()
            ) {
                HorizontalDivider(
                    modifier  = Modifier.weight(1f),
                    thickness = 0.5.dp,
                    color     = colorScheme.outlineVariant
                )
                Text(
                    text      = "Or",
                    modifier  = Modifier.padding(horizontal = 14.dp),
                    style     = MaterialTheme.typography.labelSmall,
                    color     = colorScheme.onSurfaceVariant
                )
                HorizontalDivider(
                    modifier  = Modifier.weight(1f),
                    thickness = 0.5.dp,
                    color     = colorScheme.outlineVariant
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // ── Google — full width ───────────────────────────────────────────
            OutlinedButton(
                onClick  = { /* Google OAuth */ },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape  = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp, colorScheme.outlineVariant
                ),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = colorScheme.surface,
                    contentColor   = colorScheme.onSurface
                )
            ) {
                Text(
                    text = "G",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = Color(0xFF4285F4)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text          = "Continue with Google",
                    fontWeight    = FontWeight.Medium,
                    fontSize      = 14.sp,
                    letterSpacing = 0.1.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // ── GitHub — full width ───────────────────────────────────────────
            OutlinedButton(
                onClick = {
                    val url = "https://github.com/login/oauth/authorize" +
                            "?client_id=YOUR_GITHUB_CLIENT_ID" +
                            "&scope=user:email" +
                            "&redirect_uri=scrymechat://auth"
                    CustomTabsIntent.Builder().build()
                        .launchUrl(context, Uri.parse(url))
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape  = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp, colorScheme.outlineVariant
                ),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = colorScheme.surface,
                    contentColor   = colorScheme.onSurface
                )
            ) {
                Text(
                    text = "⌥",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text          = "Continue with GitHub",
                    fontWeight    = FontWeight.Medium,
                    fontSize      = 14.sp,
                    letterSpacing = 0.1.sp
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── Sign-in link ──────────────────────────────────────────────────
            Row(
                modifier                = Modifier.fillMaxWidth(),
                horizontalArrangement   = Arrangement.Center,
                verticalAlignment       = Alignment.CenterVertically
            ) {
                Text(
                    text  = "Already have an account? ",
                    color = colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )
                ClickableText(
                    text    = AnnotatedString("Log in"),
                    onClick = { onSignInClick() },
                    style   = MaterialTheme.typography.bodySmall.copy(
                        color      = accentColor,
                        fontWeight = FontWeight.SemiBold
                    )
                )
            }

            Spacer(modifier = Modifier.height(36.dp))
        }
    }

    // ── Success bottom sheet ──────────────────────────────────────────────────
    if (showSuccessSheet) {
        ModalBottomSheet(
            onDismissRequest = { showSuccessSheet = false; onSignUpSuccess() },
            sheetState       = sheetState,
            containerColor   = colorScheme.surface,
            tonalElevation   = 0.dp,
            shape            = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 28.dp)
                    .padding(bottom = 36.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(8.dp))

                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(accentColor.copy(alpha = 0.10f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector        = Icons.Default.Check,
                        contentDescription = null,
                        tint               = accentColor,
                        modifier           = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text  = "Account created",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight    = FontWeight.Bold,
                        letterSpacing = (-0.2).sp
                    ),
                    color = colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text      = "You're all set. Welcome to Scrymechat.",
                    style     = MaterialTheme.typography.bodyMedium,
                    color     = colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(28.dp))

                HorizontalDivider(thickness = 0.5.dp, color = colorScheme.outlineVariant)

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        scope.launch { sheetState.hide() }.invokeOnCompletion {
                            if (!sheetState.isVisible) {
                                showSuccessSheet = false
                                onSignUpSuccess()
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape    = RoundedCornerShape(12.dp),
                    colors   = ButtonDefaults.buttonColors(
                        containerColor = accentColor,
                        contentColor   = colorScheme.onPrimary
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
                ) {
                    Text(
                        text          = "Go to Home",
                        fontWeight    = FontWeight.SemiBold,
                        fontSize      = 14.sp,
                        letterSpacing = 0.3.sp
                    )
                }
            }
        }
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

@Composable
private fun FieldLabel(text: String) {
    Text(
        text  = text,
        style = MaterialTheme.typography.labelMedium.copy(
            fontWeight    = FontWeight.Medium,
            letterSpacing = 0.1.sp
        ),
        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType,
    isError: Boolean = false,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingIcon: @Composable (() -> Unit)? = null
) {
    val colorScheme = MaterialTheme.colorScheme
    OutlinedTextField(
        value                = value,
        onValueChange        = onValueChange,
        isError              = isError,
        placeholder          = {
            Text(
                text  = placeholder,
                style = MaterialTheme.typography.bodyMedium,
                color = colorScheme.onSurface.copy(alpha = 0.28f)
            )
        },
        leadingIcon           = leadingIcon,
        trailingIcon          = trailingIcon,
        visualTransformation  = visualTransformation,
        keyboardOptions       = KeyboardOptions(keyboardType = keyboardType),
        singleLine            = true,
        modifier              = Modifier.fillMaxWidth(),
        shape                 = RoundedCornerShape(12.dp),
        textStyle             = MaterialTheme.typography.bodyMedium.copy(
            color = colorScheme.onSurface
        ),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor      = MaterialTheme.colorScheme.primary,
            unfocusedBorderColor    = colorScheme.outlineVariant,
            errorBorderColor        = colorScheme.error,
            focusedContainerColor   = colorScheme.surface,
            unfocusedContainerColor = colorScheme.surface,
            errorContainerColor     = colorScheme.errorContainer.copy(alpha = 0.08f),
            cursorColor             = MaterialTheme.colorScheme.primary
        )
    )
}
