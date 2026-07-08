package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("android-auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @POST("android-auth/signup")
    suspend fun signup(
        @Body request: SignUpRequest
    ): Response<LoginResponse>

    @POST("android-auth/social/google")
    suspend fun googleLogin(
        @Body request: GoogleLoginRequest
    ): Response<LoginResponse>

    @POST("android-auth/social/github")
    suspend fun githubLogin(
        @Body request: GithubLoginRequest
    ): Response<LoginResponse>

    @POST("users/me/device-tokens")
    suspend fun registerDeviceToken(
        @Body request: DeviceTokenRequest
    ): Response<Unit>

    @GET("users/me")
    suspend fun getMe(): Response<UserResponse>

    @GET("users/{id}")
    suspend fun getUser(
        @retrofit2.http.Path("id") id: String
    ): Response<UserDto>

    @POST("users/me")
    suspend fun updateMe(
        @Body request: Map<String, Any>
    ): Response<Unit>

    @POST("device-auth/qr/authorize")
    suspend fun authorizeQR(
        @Body request: QRAuthorizeRequest
    ): Response<QRAuthorizeResponse>

    @POST("android-auth/change-password")
    suspend fun changePassword(
        @Body request: Map<String, String>
    ): Response<Unit>

    @GET("users/search")
    suspend fun searchUsers(
        @retrofit2.http.Query("query") query: String
    ): Response<List<UserDto>>
}

data class QRAuthorizeRequest(
    val sessionId: String
)

data class QRAuthorizeResponse(
    val success: Boolean
)

data class UserResponse(
    val id: String,
    val name: String,
    val email: String,
    val username: String? = null,
    val avatar: String? = null,
    val image: String? = null,
    val banner: String? = null,
    val statusText: String? = null,
    val statusEmoji: String? = null,
    val bio: String? = null,
    val role: String? = null,
    val status: String? = null,
    val notificationPreferences: Any? = null
)

data class DeviceTokenRequest(
    val token: String,
    val platform: String,
    val deviceInfo: Map<String, String>? = null
)
