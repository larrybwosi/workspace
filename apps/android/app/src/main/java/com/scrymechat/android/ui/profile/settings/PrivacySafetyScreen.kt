package com.scrymechat.android.ui.profile.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.scrymechat.android.ui.profile.ProfileViewModel
import com.scrymechat.android.ui.profile.profilePalette

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun PrivacySafetyScreen(
    onBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val palette = profilePalette()
    val uiState by viewModel.uiState.collectAsState()

    // In a real app, these would come from user.preferences or similar
    var allowDms by remember { mutableStateOf(true) }

    Scaffold(
        topBar = { SettingsTopBar("Privacy & Safety", palette, onBack) },
        containerColor = palette.canvasBg
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(SettingsTokens.ScreenPadding)
        ) {
            SectionHeader(
                title = "Direct Message Safety",
                subtitle = "Control who can start a direct conversation with you.",
                palette = palette
            )
            Spacer(modifier = Modifier.height(16.dp))
            SettingsCard(palette) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Allow direct messages from server members", color = palette.textPrimary, fontWeight = FontWeight.Medium)
                        Text(
                            "Members of shared servers can message you directly.",
                            color = palette.textSecondary,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Switch(
                        checked = allowDms,
                        onCheckedChange = {
                            allowDms = it
                            viewModel.updateProfile(mapOf("privacySettings" to mapOf("allowDmsFromMembers" to it)))
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = palette.accent, checkedTrackColor = palette.accent.copy(alpha = 0.5f))
                    )
                }
            }
        }
    }
}
