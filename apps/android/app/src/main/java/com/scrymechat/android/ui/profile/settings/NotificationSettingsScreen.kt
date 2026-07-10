package com.scrymechat.android.ui.profile.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Tag
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.remote.AuthApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Notification preferences screen.
 *
 * UX conventions applied here:
 *  - Settings are grouped under labeled cards (matches the urgent/high/normal channel
 *    split used on the notification side) instead of one flat list.
 *  - Toggles update optimistically, then roll back with an explanatory snackbar if the
 *    backend save fails — the UI never silently lies about saved state.
 *  - A failed initial load shows a real error state with a retry action instead of an
 *    empty/stuck screen.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationSettingsScreen(
    onBack: () -> Unit,
    viewModel: NotificationSettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        viewModel.errorEvents.collect { message ->
            snackbarHostState.showSnackbar(message)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            uiState.isLoading -> {
                Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }

            uiState.loadFailed -> {
                LoadErrorState(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    onRetry = viewModel::retryLoad
                )
            }

            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    item {
                        SettingsSection(title = "Conversations") {
                            NotificationToggle(
                                icon = Icons.Default.Forum,
                                title = "Direct messages",
                                description = "Notify me for private messages",
                                checked = uiState.dmsEnabled,
                                saving = uiState.savingKey == "dms",
                                onCheckedChange = { viewModel.toggleDms(it) }
                            )
                            HorizontalDivider()
                            NotificationToggle(
                                icon = Icons.Default.AlternateEmail,
                                title = "Mentions",
                                description = "Notify me when someone @mentions me",
                                checked = uiState.mentionsEnabled,
                                saving = uiState.savingKey == "mentions",
                                onCheckedChange = { viewModel.toggleMentions(it) }
                            )
                        }
                    }
                    item {
                        SettingsSection(title = "Channels") {
                            NotificationToggle(
                                icon = Icons.Default.Tag,
                                title = "Channel activity",
                                description = "Notify me about new messages in channels I've joined",
                                checked = uiState.channelsEnabled,
                                saving = uiState.savingKey == "channels",
                                onCheckedChange = { viewModel.toggleChannels(it) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column {
        Text(
            text = title.uppercase(),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)
        ) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                content()
            }
        }
    }
}

@Composable
fun NotificationToggle(
    icon: ImageVector,
    title: String,
    description: String,
    checked: Boolean,
    saving: Boolean = false,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(22.dp)
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyLarge)
            Text(
                description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        if (saving) {
            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
        } else {
            Switch(checked = checked, onCheckedChange = onCheckedChange)
        }
    }
}

@Composable
private fun LoadErrorState(modifier: Modifier = Modifier, onRetry: () -> Unit) {
    Column(
        modifier = modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            "Couldn't load notification settings",
            style = MaterialTheme.typography.titleMedium,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            "Check your connection and try again.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Retry")
        }
    }
}

data class NotificationSettingsUiState(
    val isLoading: Boolean = false,
    val loadFailed: Boolean = false,
    val dmsEnabled: Boolean = true,
    val mentionsEnabled: Boolean = true,
    val channelsEnabled: Boolean = true,
    // Key of the preference currently being persisted, shown as an inline spinner
    // instead of letting the switch flip silently with no save feedback.
    val savingKey: String? = null
)

@HiltViewModel
class NotificationSettingsViewModel @Inject constructor(
    private val authApi: AuthApi,
    private val sessionManager: SessionManager
) : ViewModel() {
    private val _uiState = MutableStateFlow(NotificationSettingsUiState())
    val uiState = _uiState.asStateFlow()

    private val _errorEvents = MutableSharedFlow<String>(extraBufferCapacity = 1)
    val errorEvents = _errorEvents.asSharedFlow()

    init {
        loadPreferences()
    }

    fun retryLoad() = loadPreferences()

    private fun loadPreferences() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, loadFailed = false)
            try {
                val response = authApi.getMe()
                if (response.isSuccessful) {
                    val user = response.body()
                    val prefs = user?.notificationPreferences as? Map<String, Any>
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        dmsEnabled = prefs?.get("dmsEnabled") as? Boolean ?: true,
                        mentionsEnabled = prefs?.get("mentionsEnabled") as? Boolean ?: true,
                        channelsEnabled = prefs?.get("channelsEnabled") as? Boolean ?: true
                    )
                } else {
                    _uiState.value = _uiState.value.copy(isLoading = false, loadFailed = true)
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, loadFailed = true)
            }
        }
    }

    fun toggleDms(enabled: Boolean) = applyToggle(
        key = "dms",
        newValue = enabled,
        currentValue = { it.dmsEnabled },
        apply = { state, value -> state.copy(dmsEnabled = value) }
    )

    fun toggleMentions(enabled: Boolean) = applyToggle(
        key = "mentions",
        newValue = enabled,
        currentValue = { it.mentionsEnabled },
        apply = { state, value -> state.copy(mentionsEnabled = value) }
    )

    fun toggleChannels(enabled: Boolean) = applyToggle(
        key = "channels",
        newValue = enabled,
        currentValue = { it.channelsEnabled },
        apply = { state, value -> state.copy(channelsEnabled = value) }
    )

    /**
     * Applies a toggle optimistically, persists it, and rolls back with a snackbar
     * if the save fails — so the switch never shows a state that isn't actually saved.
     */
    private fun applyToggle(
        key: String,
        newValue: Boolean,
        currentValue: (NotificationSettingsUiState) -> Boolean,
        apply: (NotificationSettingsUiState, Boolean) -> NotificationSettingsUiState
    ) {
        val previousValue = currentValue(_uiState.value)
        _uiState.value = apply(_uiState.value, newValue).copy(savingKey = key)

        viewModelScope.launch {
            try {
                val state = _uiState.value
                val response = authApi.updateMe(
                    mapOf(
                        "notificationPreferences" to mapOf(
                            "dmsEnabled" to state.dmsEnabled,
                            "mentionsEnabled" to state.mentionsEnabled,
                            "channelsEnabled" to state.channelsEnabled
                        )
                    )
                )
                if (!response.isSuccessful) {
                    throw IllegalStateException("Save failed with ${response.code()}")
                }
                _uiState.value = _uiState.value.copy(savingKey = null)
            } catch (e: Exception) {
                _uiState.value = apply(_uiState.value, previousValue).copy(savingKey = null)
                _errorEvents.tryEmit("Couldn't save your setting. Please try again.")
            }
        }
    }
}
