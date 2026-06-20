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
        val token = sessionManagerProvider.get().getToken()

        val authenticatedRequest = if (token.isNullOrBlank()) {
            originalRequest
        } else {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }

        val response = chain.proceed(authenticatedRequest)

        if (response.code == 401 && !originalRequest.url.toString().contains("auth/android/refresh")) {
            response.close()

            // Try to refresh the token
            val refreshResult = runBlocking {
                authRepositoryProvider.get().refresh()
            }

            if (refreshResult.isSuccess) {
                val newToken = sessionManagerProvider.get().getToken()
                val newRequest = originalRequest.newBuilder()
                    .header("Authorization", "Bearer $newToken")
                    .build()
                return chain.proceed(newRequest)
            } else {
                // If refresh fails, clear session
                runBlocking {
                    sessionManagerProvider.get().clearSession()
                }
            }
        }

        return response
    }
}
