package com.scrymechat.android.data.repository

import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.remote.AuthApi
import com.scrymechat.android.data.remote.LoginRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val sessionManager: SessionManager
) {
    suspend fun login(email: String, password: String): Result<Unit> {
        return try {
            val response = authApi.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    sessionManager.saveToken(body.token)
                    Result.success(Unit)
                } else {
                    Result.failure(Exception("Empty response body"))
                }
            } else {
                Result.failure(Exception("Login failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun isLoggedIn(): Boolean {
        return sessionManager.getToken() != null
    }

    fun logout() {
        sessionManager.clearSession()
    }
}
