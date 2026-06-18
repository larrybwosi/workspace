package com.scrymechat.android.data.repository

import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.remote.CreateInvitationRequest
import com.scrymechat.android.data.remote.InvitationDto
import com.scrymechat.android.data.remote.InvitationsApi
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InvitationsRepository @Inject constructor(
    private val api: InvitationsApi
) {
    suspend fun getInvitations(workspaceId: String? = null): Resource<List<InvitationDto>> {
        return try {
            val response = api.getInvitations(workspaceId)
            if (response.isSuccessful) {
                Resource.Success(response.body() ?: emptyList())
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun createInvitation(
        email: String,
        role: String? = null,
        workspaceId: String? = null,
        channelId: String? = null
    ): Resource<InvitationDto> {
        return try {
            val response = api.createInvitation(CreateInvitationRequest(email, role, workspaceId, channelId))
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun acceptInvitation(token: String): Resource<Unit> {
        return try {
            val response = api.acceptInvitation(token)
            if (response.isSuccessful) {
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }
}
