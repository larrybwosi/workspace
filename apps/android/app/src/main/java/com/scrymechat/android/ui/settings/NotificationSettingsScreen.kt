package com.scrymechat.android.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.remote.AuthApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationSettingsScreen(
    onBack: () -> Unit,
    viewModel: NotificationSettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notification Settings") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text("Global Preferences", style = MaterialTheme.typography.titleMedium)
                }
                item {
                    NotificationToggle(
                        title = "Direct Messages",
                        description = "Receive notifications for private messages",
                        checked = uiState.dmsEnabled,
                        onCheckedChange = { viewModel.toggleDms(it) }
                    )
                }
                item {
                    NotificationToggle(
                        title = "Mentions",
                        description = "Receive notifications when you are mentioned",
                        checked = uiState.mentionsEnabled,
                        onCheckedChange = { viewModel.toggleMentions(it) }
                    )
                }
                item {
                    NotificationToggle(
                        title = "Channel Alerts",
                        description = "Receive notifications for channel activity",
                        checked = uiState.channelsEnabled,
                        onCheckedChange = { viewModel.toggleChannels(it) }
                    )
                }
            }
        }
    }
}

@Composable
fun NotificationToggle(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyLarge)
            Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

data class NotificationSettingsUiState(
    val isLoading: Boolean = false,
    val dmsEnabled: Boolean = true,
    val mentionsEnabled: Boolean = true,
    val channelsEnabled: Boolean = true
)

@HiltViewModel
class NotificationSettingsViewModel @Inject constructor(
    private val authApi: AuthApi,
    private val sessionManager: SessionManager
) : ViewModel() {
    private val _uiState = MutableStateFlow(NotificationSettingsUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadPreferences()
    }

    private fun loadPreferences() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val response = authApi.getMe()
                if (response.isSuccessful) {
                    val user = response.body()
                    val prefs = user?.notificationPreferences as? Map<String, Any>
                    _uiState.value = _uiState.value.copy(
                        dmsEnabled = prefs?.get("dmsEnabled") as? Boolean ?: true,
                        mentionsEnabled = prefs?.get("mentionsEnabled") as? Boolean ?: true,
                        channelsEnabled = prefs?.get("channelsEnabled") as? Boolean ?: true
                    )
                }
                _uiState.value = _uiState.value.copy(isLoading = false)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }

    fun toggleDms(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(dmsEnabled = enabled)
        updateBackend()
    }

    fun toggleMentions(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(mentionsEnabled = enabled)
        updateBackend()
    }

    fun toggleChannels(enabled: Boolean) {
        _uiState.value = _uiState.value.copy(channelsEnabled = enabled)
        updateBackend()
    }

    private fun updateBackend() {
        viewModelScope.launch {
            try {
                val current = _uiState.value
                authApi.updateMe(
                    mapOf(
                        "notificationPreferences" to mapOf(
                            "dmsEnabled" to current.dmsEnabled,
                            "mentionsEnabled" to current.mentionsEnabled,
                            "channelsEnabled" to current.channelsEnabled
                        )
                    )
                )
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
