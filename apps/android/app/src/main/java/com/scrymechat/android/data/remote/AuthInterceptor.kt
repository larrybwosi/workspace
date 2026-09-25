package com.scrymechat.android.data.remote

import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.repository.AuthRepository
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Provider

class AuthInterceptor @Inject constructor(
    private val sessionManagerProvider: Provider<SessionManager>,
    private val authRepositoryProvider: Provider<AuthRepository>
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val sessionManager = sessionManagerProvider.get()
        val initialToken = sessionManager.getToken()

        val requestToProceed = if (!initialToken.isNullOrBlank()) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $initialToken")
                .build()
        } else {
            originalRequest
        }

        val response = chain.proceed(requestToProceed)

        // Do not attempt refresh on auth endpoints themselves (e.g., login, signup, refresh)
        val path = originalRequest.url.encodedPath
        if (path.contains("android-auth/login") ||
            path.contains("android-auth/signup") ||
            path.contains("android-auth/refresh") ||
            path.contains("android-auth/social/")
        ) {
            return response
        }

        if (response.code == 401 && !initialToken.isNullOrBlank()) {
            synchronized(this) {
                val currentToken = sessionManager.getToken()
                // If another thread already refreshed the token
                val newToken = if (currentToken != null && currentToken != initialToken) {
                    currentToken
                } else {
                    runBlocking {
                        val refreshResult = authRepositoryProvider.get().refreshToken(initialToken)
                        refreshResult.getOrNull()
                    }
                }

                if (!newToken.isNullOrBlank()) {
                    response.close()
                    val newRequest = originalRequest.newBuilder()
                        .header("Authorization", "Bearer $newToken")
                        .build()
                    return chain.proceed(newRequest)
                } else {
                    runBlocking {
                        sessionManager.clearSession()
                    }
                }
            }
        }

        return response
    }
}
