package com.scrymechat.android.ui.profile.settings

import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.remote.AuthApi
import com.scrymechat.android.data.remote.UserResponse
import com.scrymechat.android.ui.login.BaseViewModelTest
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.*
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class NotificationSettingsViewModelTest : BaseViewModelTest() {

    private val authApi: AuthApi = mock()
    private val sessionManager: SessionManager = mock()

    @Before
    override fun setUp() {
        super.setUp()
    }

    @Test
    fun `loadPreferences succeeds and updates UI state`() = runTest {
        val prefsMap = mapOf(
            "dmsEnabled" to true,
            "mentionsEnabled" to false,
            "channelsEnabled" to true
        )
        val user = UserResponse(
            id = "user1",
            name = "Test User",
            email = "test@example.com",
            username = "testuser",
            notificationPreferences = prefsMap
        )

        whenever(authApi.getMe()).thenReturn(Response.success(user))

        val viewModel = NotificationSettingsViewModel(authApi, sessionManager)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.loadFailed)
        assertTrue(state.dmsEnabled)
        assertFalse(state.mentionsEnabled)
        assertTrue(state.channelsEnabled)
    }

    @Test
    fun `loadPreferences fails and updates loadFailed state`() = runTest {
        whenever(authApi.getMe()).thenReturn(Response.error(500, "".toResponseBody(null)))

        val viewModel = NotificationSettingsViewModel(authApi, sessionManager)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertTrue(state.loadFailed)
    }

    @Test
    fun `toggleDms optimistically updates and persists preference`() = runTest {
        val user = UserResponse(
            id = "user1",
            name = "Test User",
            email = "test@example.com",
            username = "testuser",
            notificationPreferences = mapOf("dmsEnabled" to true, "mentionsEnabled" to true, "channelsEnabled" to true)
        )
        whenever(authApi.getMe()).thenReturn(Response.success(user))
        whenever(authApi.updateMe(any())).thenReturn(Response.success(Unit))

        val viewModel = NotificationSettingsViewModel(authApi, sessionManager)
        advanceUntilIdle()

        viewModel.toggleDms(false)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.dmsEnabled)
        assertNull(state.savingKey)
        verify(authApi).updateMe(argThat { map ->
            val inner = map["notificationPreferences"] as? Map<*, *>
            inner?.get("dmsEnabled") == false
        })
    }

    @Test
    fun `toggleDms rolls back state on failure`() = runTest {
        val user = UserResponse(
            id = "user1",
            name = "Test User",
            email = "test@example.com",
            username = "testuser",
            notificationPreferences = mapOf("dmsEnabled" to true, "mentionsEnabled" to true, "channelsEnabled" to true)
        )
        whenever(authApi.getMe()).thenReturn(Response.success(user))
        whenever(authApi.updateMe(any())).thenReturn(Response.error(500, "".toResponseBody(null)))

        val viewModel = NotificationSettingsViewModel(authApi, sessionManager)
        advanceUntilIdle()

        viewModel.toggleDms(false)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state.dmsEnabled) // Rolled back to true
        assertNull(state.savingKey)
    }
}
