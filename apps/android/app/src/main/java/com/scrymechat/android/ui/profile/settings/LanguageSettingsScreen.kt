package com.scrymechat.android.ui.profile.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scrymechat.android.ui.profile.ProfileViewModel
import com.scrymechat.android.ui.profile.ProfilePalette
import com.scrymechat.android.ui.profile.profilePalette

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun LanguageSettingsScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val palette = profilePalette()
    val selectedLanguage by viewModel.language.collectAsState()

    Scaffold(
        topBar = { SettingsTopBar("Language", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding)
        ) {
            SectionHeader(title = "Display Language", palette = palette)
            Spacer(modifier = Modifier.height(16.dp))
            SettingsCard(palette) {
                LanguageOption("English (US)", "en_us", selectedLanguage, palette) { viewModel.updateLanguage(it) }
                HorizontalDivider(color = palette.cardBorder, modifier = Modifier.padding(vertical = 4.dp))
                LanguageOption("English (UK)", "en_uk", selectedLanguage, palette) { viewModel.updateLanguage(it) }
            }
        }
    }
}

@Composable
fun LanguageOption(label: String, value: String, selectedValue: String, palette: ProfilePalette, onSelect: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect(value) }
            .padding(vertical = SettingsTokens.RowVerticalPadding),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = palette.textPrimary, modifier = Modifier.weight(1f))
        if (value == selectedValue) {
            Icon(Icons.Default.Check, contentDescription = "Selected", tint = palette.accent)
        }
    }
}
