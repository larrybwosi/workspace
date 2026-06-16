package com.scrymechat.android.data.remote

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: UserDto,
    val session: SessionDto
)

data class UserDto(
    val id: String,
    val email: String,
    val name: String,
    val image: String?
)

data class SessionDto(
    val id: String,
    val token: String,
    val expiresAt: String
)

data class AuthErrorResponse(
    val message: String,
    val error: String?
)
