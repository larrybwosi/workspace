package com.scrymechat.android.ui.theme

import androidx.lifecycle.ViewModel
import com.scrymechat.android.data.local.SessionManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

@HiltViewModel
class ThemeViewModel @Inject constructor(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _themePreference = MutableStateFlow(sessionManager.getThemePreference())
    val themePreference: StateFlow<String> = _themePreference

    private val _apiUrl = MutableStateFlow(sessionManager.getApiUrl() ?: com.scrymechat.android.BuildConfig.API_URL)
    val apiUrl: StateFlow<String> = _apiUrl

    fun updateTheme(theme: String) {
        sessionManager.saveThemePreference(theme)
        _themePreference.value = theme
    }

    fun updateApiUrl(url: String) {
        sessionManager.saveApiUrl(url)
        _apiUrl.value = url
    }
}
