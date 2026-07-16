package com.scrymechat.android.ui.profile.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scrymechat.android.ui.profile.ProfileViewModel
import com.scrymechat.android.ui.profile.ProfilePalette
import com.scrymechat.android.ui.profile.profilePalette

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun VoiceSettingsScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val palette = profilePalette()
    val voiceMode by viewModel.voiceMode.collectAsState()

    Scaffold(
        topBar = { SettingsTopBar("Voice", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding)
        ) {
            SectionHeader(
                title = "Input Mode",
                subtitle = "Choose how your microphone is activated during calls.",
                palette = palette
            )
            Spacer(modifier = Modifier.height(16.dp))
            SettingsCard(palette) {
                SelectableOptionRow(
                    label = "Voice Activity",
                    description = "Automatically transmit when you speak.",
                    selected = voiceMode == "voice_activity",
                    palette = palette,
                    onSelect = { viewModel.updateVoiceMode("voice_activity") }
                )
                HorizontalDivider(color = palette.cardBorder, modifier = Modifier.padding(vertical = 4.dp))
                SelectableOptionRow(
                    label = "Push to Talk",
                    description = "Hold a key or button to transmit audio.",
                    selected = voiceMode == "push_to_talk",
                    palette = palette,
                    onSelect = { viewModel.updateVoiceMode("push_to_talk") }
                )
            }
        }
    }
}

@Composable
private fun SelectableOptionRow(
    label: String,
    description: String? = null,
    selected: Boolean,
    palette: ProfilePalette,
    onSelect: () -> Unit
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onSelect)
            .padding(vertical = SettingsTokens.RowVerticalPadding / 2)
    ) {
        RadioButton(
            selected = selected,
            onClick = onSelect,
            colors = RadioButtonDefaults.colors(selectedColor = palette.accent)
        )
        Column {
            Text(label, color = palette.textPrimary, fontWeight = FontWeight.Medium)
            if (description != null) {
                Text(description, color = palette.textSecondary, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
