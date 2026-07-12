package com.scrymechat.android.ui.profile.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.scrymechat.android.ui.profile.ProfilePalette
import com.scrymechat.android.ui.profile.profilePalette

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun AppearanceSettingsScreen(
    onBack: () -> Unit,
    currentTheme: String,
    onThemeChange: (String) -> Unit
) {
    val palette = profilePalette()
    Scaffold(
        topBar = { SettingsTopBar("Appearance", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding)
        ) {
            SectionHeader(
                title = "Theme",
                subtitle = "Choose how the app looks on this device.",
                palette = palette
            )
            Spacer(modifier = Modifier.height(16.dp))
            SettingsCard(palette) {
                ThemeOption("System Default", "system", currentTheme, onThemeChange, palette)
                HorizontalDivider(color = palette.cardBorder, modifier = Modifier.padding(vertical = 4.dp))
                ThemeOption("Dark", "dark", currentTheme, onThemeChange, palette)
                HorizontalDivider(color = palette.cardBorder, modifier = Modifier.padding(vertical = 4.dp))
                ThemeOption("Light", "light", currentTheme, onThemeChange, palette)
            }
        }
    }
}

@Composable
fun ThemeOption(label: String, value: String, currentValue: String, onSelect: (String) -> Unit, palette: ProfilePalette) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect(value) }
            .padding(vertical = SettingsTokens.RowVerticalPadding / 2)
    ) {
        RadioButton(
            selected = currentValue == value,
            onClick = { onSelect(value) },
            colors = RadioButtonDefaults.colors(selectedColor = palette.accent)
        )
        Text(label, color = palette.textPrimary, modifier = Modifier.padding(start = 8.dp), fontWeight = FontWeight.Medium)
    }
}
