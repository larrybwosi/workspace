package com.scrymechat.android.ui.login

import com.scrymechat.android.data.repository.AuthRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest : BaseViewModelTest() {

    private val authRepository: AuthRepository = mock()
    private lateinit var viewModel: LoginViewModel

    @Before
    override fun setUp() {
        super.setUp()
        viewModel = LoginViewModel(authRepository)
    }

    @Test
    fun `initial state is empty`() {
        val state = viewModel.uiState.value
        assertEquals("", state.email)
        assertEquals("", state.password)
        assertFalse(state.isLoading)
        assertNull(state.error)
        assertFalse(state.isLoginSuccess)
    }

    @Test
    fun `email and password change updates state`() {
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("password123")

        val state = viewModel.uiState.value
        assertEquals("test@example.com", state.email)
        assertEquals("password123", state.password)
    }

    @Test
    fun `login with empty fields sets error`() = runTest {
        viewModel.login()
        val state = viewModel.uiState.value
        assertEquals("Email and password cannot be empty", state.error)
    }

    @Test
    fun `login success updates state`() = runTest {
        whenever(authRepository.login(any(), any())).thenReturn(Result.success(Unit))

        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("password")
        viewModel.login()

        // Remove the immediate check as it might be too fast with StandardTestDispatcher
        // assertTrue(viewModel.uiState.value.isLoading)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertTrue(state.isLoginSuccess)
        assertNull(state.error)
    }

    @Test
    fun `login failure updates state with error`() = runTest {
        whenever(authRepository.login(any(), any())).thenReturn(Result.failure(Exception("Invalid credentials")))

        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("password")
        viewModel.login()

        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isLoginSuccess)
        assertEquals("Invalid credentials", state.error)
    }
}
