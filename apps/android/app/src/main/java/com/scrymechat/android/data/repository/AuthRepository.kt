package com.scrymechat.android.data.repository

import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.entities.SessionEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceMemberEntity
import com.scrymechat.android.data.remote.*
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
            handleAuthResponse(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signup(email: String, password: String, name: String, username: String): Result<Unit> {
        return try {
            val response = authApi.signup(SignUpRequest(email, password, name, username))
            handleAuthResponse(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun googleLogin(idToken: String): Result<Unit> {
        return try {
            val response = authApi.googleLogin(GoogleLoginRequest(idToken))
            handleAuthResponse(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun githubLogin(code: String): Result<Unit> {
        return try {
            val response = authApi.githubLogin(GithubLoginRequest(code))
            handleAuthResponse(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun handleAuthResponse(response: retrofit2.Response<LoginResponse>): Result<Unit> {
        if (response.isSuccessful) {
            val body = response.body()
            if (body != null) {
                sessionManager.saveToken(body.token)

                val userEntity = UserEntity(
                    id = body.user.id,
                    name = body.user.name,
                    username = body.user.username,
                    email = body.user.email,
                    avatar = body.user.avatar,
                    banner = body.user.banner,
                    statusText = body.user.statusText,
                    statusEmoji = body.user.statusEmoji,
                    role = body.user.role ?: "user",
                    status = body.user.status ?: "offline"
                )

                val sessionEntity = SessionEntity(
                    id = body.session.id,
                    userId = body.user.id,
                    expiresAt = body.session.expiresAt
                )

                val membershipEntities = body.memberships?.map {
                    WorkspaceMemberEntity(
                        id = it.id,
                        workspaceId = it.workspaceId,
                        userId = it.userId,
                        role = it.role,
                        permissions = it.permissions,
                        memberType = it.memberType
                    )
                } ?: emptyList()

                sessionManager.saveSession(sessionEntity, userEntity, membershipEntities)

                return Result.success(Unit)
            } else {
                return Result.failure(Exception("Empty response body"))
            }
        } else {
            return Result.failure(Exception("Authentication failed: ${response.code()}"))
        }
    }

    fun isLoggedIn(): Boolean {
        return sessionManager.getToken() != null
    }

    suspend fun logout() {
        sessionManager.clearSession()
    }

    suspend fun registerDeviceToken(token: String, platform: String): Result<Unit> {
        return try {
            val response = authApi.registerDeviceToken(DeviceTokenRequest(token, platform))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Token registration failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun authorizeQR(sessionId: String): Result<Unit> {
        return try {
            val response = authApi.authorizeQR(com.scrymechat.android.data.remote.QRAuthorizeRequest(sessionId))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("QR Authorization failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
