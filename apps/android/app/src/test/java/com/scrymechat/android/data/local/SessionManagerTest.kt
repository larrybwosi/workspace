package com.scrymechat.android.data.local

import android.content.Context
import android.content.SharedPreferences
import com.scrymechat.android.data.local.dao.SessionDao
import com.scrymechat.android.data.local.dao.UserDao
import com.scrymechat.android.data.local.dao.WorkspaceMemberDao
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.*
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class SessionManagerTest {

    private val context: Context = mock()
    private val sessionDao: SessionDao = mock()
    private val userDao: UserDao = mock()
    private val workspaceMemberDao: WorkspaceMemberDao = mock()
    private val fallbackPrefs: SharedPreferences = mock()

    @Before
    fun setUp() {
        whenever(context.getSharedPreferences(eq("scrymechat_prefs_fallback"), any()))
            .thenReturn(fallbackPrefs)
    }

    @Test
    fun `when EncryptedSharedPreferences fails to initialize, SessionManager recovers or falls back to unencrypted SharedPreferences`() {
        whenever(context.getSharedPreferences(eq("scrymechat_prefs"), any()))
            .thenThrow(RuntimeException("Simulated Keystore/Tink initialization error"))

        val sessionManager = SessionManager(
            context = context,
            sessionDao = sessionDao,
            userDao = userDao,
            workspaceMemberDao = workspaceMemberDao
        )

        assertNotNull(sessionManager)
        verify(context, atLeastOnce()).getSharedPreferences(eq("scrymechat_prefs_fallback"), any())
    }

    @Test
    fun `when initialization succeeds, SessionManager initializes EncryptedSharedPreferences successfully`() {
        val realContext = RuntimeEnvironment.getApplication()
        val sessionManager = SessionManager(
            context = realContext,
            sessionDao = sessionDao,
            userDao = userDao,
            workspaceMemberDao = workspaceMemberDao
        )
        assertNotNull(sessionManager)
    }
}
