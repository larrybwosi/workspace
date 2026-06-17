package com.scrymechat.android.data.remote

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: UserDto,
    val session: SessionDto,
    val memberships: List<WorkspaceMemberDto>? = null
)

data class SignUpRequest(
    val email: String,
    val password: String,
    val name: String,
    val username: String
)

data class GoogleLoginRequest(
    val idToken: String
)

data class GithubLoginRequest(
    val code: String
)

data class UserDto(
    val id: String,
    val email: String,
    val name: String,
    val username: String?,
    val avatar: String?,
    val banner: String?,
    val statusText: String?,
    val statusEmoji: String?,
    val role: String,
    val status: String
)

data class SessionDto(
    val id: String,
    val token: String,
    val expiresAt: String
)

data class WorkspaceMemberDto(
    val id: String,
    val workspaceId: String,
    val userId: String,
    val role: String,
    val permissions: Long,
    val memberType: String
)

data class AuthErrorResponse(
    val message: String,
    val error: String?
)
