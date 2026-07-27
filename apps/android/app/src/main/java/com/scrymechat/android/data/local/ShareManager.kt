package com.scrymechat.android.data.local

import android.net.Uri
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

data class SharedContent(
    val text: String? = null,
    val uris: List<Uri> = emptyList(),
    val mimeType: String? = null
)

@Singleton
class ShareManager @Inject constructor() {
    private val _sharedContent = MutableStateFlow<SharedContent?>(null)
    val sharedContent: StateFlow<SharedContent?> = _sharedContent.asStateFlow()

    fun setSharedContent(content: SharedContent?) {
        _sharedContent.value = content
    }

    fun clear() {
        _sharedContent.value = null
    }
}
