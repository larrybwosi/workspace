package com.scrymechat.android.data.repository

import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.local.entities.SessionEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceMemberEntity
import com.scrymechat.android.data.remote.AuthApi
import com.scrymechat.android.data.remote.DeviceTokenRequest
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

                    val userEntity = UserEntity(
                        id = body.user.id,
                        name = body.user.name,
                        username = body.user.username,
                        email = body.user.email,
                        avatar = body.user.avatar,
                        banner = body.user.banner,
                        statusText = body.user.statusText,
                        statusEmoji = body.user.statusEmoji,
                        role = body.user.role,
                        status = body.user.status
                    )

                    val sessionEntity = SessionEntity(
                        id = body.session.id,
                        userId = body.user.id,
                        expiresAt = body.session.expiresAt
                    )

                    val membershipEntities = body.memberships.map {
                        WorkspaceMemberEntity(
                            id = it.id,
                            workspaceId = it.workspaceId,
                            userId = it.userId,
                            role = it.role,
                            permissions = it.permissions,
                            memberType = it.memberType
                        )
                    }

                    sessionManager.saveSession(sessionEntity, userEntity, membershipEntities)

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
