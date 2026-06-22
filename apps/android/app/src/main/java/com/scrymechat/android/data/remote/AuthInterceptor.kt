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

        // Skip interception for the refresh endpoint to avoid potential loops
        if (originalRequest.url.encodedPath.contains("auth/android/refresh")) {
            return chain.proceed(originalRequest)
        }

        val sessionManager = sessionManagerProvider.get()
        val token = sessionManager.getToken()

        if (token.isNullOrBlank()) {
            return chain.proceed(originalRequest)
        }

        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()

        val response = chain.proceed(authenticatedRequest)

        if (response.code == 401) {
            synchronized(this) {
                val newToken = sessionManager.getToken()

                // If token has changed, it was already refreshed by another thread
                if (newToken != token && !newToken.isNullOrBlank()) {
                    response.close()
                    val retryRequest = originalRequest.newBuilder()
                        .header("Authorization", "Bearer $newToken")
                        .build()
                    return chain.proceed(retryRequest)
                }

                // Try to refresh
                val refreshResult = runBlocking {
                    authRepositoryProvider.get().refresh()
                }

                if (refreshResult.isSuccess) {
                    response.close()
                    val refreshedToken = sessionManager.getToken()
                    val retryRequest = originalRequest.newBuilder()
                        .header("Authorization", "Bearer $refreshedToken")
                        .build()
                    return chain.proceed(retryRequest)
                }
            }
        }

        return response
    }
}
