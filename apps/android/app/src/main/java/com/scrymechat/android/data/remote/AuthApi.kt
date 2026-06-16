package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    @POST("android/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>
}
