package com.scrymechat.android.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

val LocalThemeIsDark = androidx.compose.runtime.staticCompositionLocalOf { false }

private val DarkColorScheme = darkColorScheme(
    primary = DiscordBrandBlurple,
    secondary = DiscordChannelSidebarBg,
    tertiary = Pink80,
    background = DiscordMainBackground,
    surface = DiscordSurfaceInputAndDialogs,
    onPrimary = Color.White,
    onSecondary = DiscordTextPrimary,
    onTertiary = Color.White,
    onBackground = DiscordTextPrimary,
    onSurface = DiscordTextPrimary,
    surfaceVariant = DiscordChannelSidebarBg,
    onSurfaceVariant = DiscordTextSecondary,
    outlineVariant = DiscordDivider
)

private val LightColorScheme = lightColorScheme(
    primary = DiscordBrandBlurple,
    secondary = Color(0xFFF2F3F5),
    tertiary = Pink40,
    background = Color(0xFFFFFFFF),
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = Color(0xFF313338),
    onTertiary = Color.White,
    onBackground = Color(0xFF313338),
    onSurface = Color(0xFF313338),
    surfaceVariant = Color(0xFFF2F3F5),
    onSurfaceVariant = Color(0xFF4E5058),
    outlineVariant = Color(0xFFE3E5E8)
)

@Composable
fun ScrymechatTheme(
    themePreference: String = "system",
    darkTheme: Boolean = when (themePreference) {
        "dark" -> true
        "light" -> false
        else -> isSystemInDarkTheme()
    },
    // Dynamic color is disabled by default to ensure custom Discord theme is used
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    androidx.compose.runtime.CompositionLocalProvider(LocalThemeIsDark provides darkTheme) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}
