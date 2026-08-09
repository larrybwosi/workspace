package com.scrymechat.android.ui.signup

import com.scrymechat.android.data.repository.AuthRepository
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.ui.login.BaseViewModelTest
import android.content.Context
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class SignUpViewModelTest : BaseViewModelTest() {

    private val authRepository: AuthRepository = mock()
    private val sessionManager: SessionManager = mock()
    private val context: Context = mock()
    private lateinit var viewModel: SignUpViewModel

    @Before
    override fun setUp() {
        super.setUp()
        viewModel = SignUpViewModel(authRepository, sessionManager, context)
    }

    @Test
    fun `initial state is empty`() {
        val state = viewModel.uiState.value
        assertEquals("", state.name)
        assertEquals("", state.username)
        assertEquals("", state.email)
        assertEquals("", state.password)
        assertFalse(state.isLoading)
        assertNull(state.error)
        assertFalse(state.isSignUpSuccess)
    }

    @Test
    fun `form changes update state`() {
        viewModel.onNameChanged("John Doe")
        viewModel.onUsernameChanged("johndoe")
        viewModel.onEmailChanged("john@example.com")
        viewModel.onPasswordChanged("password123")

        val state = viewModel.uiState.value
        assertEquals("John Doe", state.name)
        assertEquals("johndoe", state.username)
        assertEquals("john@example.com", state.email)
        assertEquals("password123", state.password)
    }
}
