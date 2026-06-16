package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("android/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @POST("users/me/device-tokens")
    suspend fun registerDeviceToken(
        @Body request: DeviceTokenRequest
    ): Response<Unit>

    @GET("users/me")
    suspend fun getMe(): Response<UserResponse>

    @POST("users/me")
    suspend fun updateMe(
        @Body request: Map<String, Any>
    ): Response<Unit>
}

data class UserResponse(
    val id: String,
    val name: String,
    val email: String,
    val notificationPreferences: Any? = null
)

data class DeviceTokenRequest(
    val token: String,
    val platform: String,
    val deviceInfo: Map<String, String>? = null
)
