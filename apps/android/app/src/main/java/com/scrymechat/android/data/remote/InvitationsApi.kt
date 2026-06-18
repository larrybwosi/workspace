package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.*

interface InvitationsApi {
    @GET("invitations")
    suspend fun getInvitations(@Query("workspaceId") workspaceId: String? = null): Response<List<InvitationDto>>

    @POST("invitations")
    suspend fun createInvitation(@Body request: CreateInvitationRequest): Response<InvitationDto>

    @GET("invitations/{token}")
    suspend fun getInvitationByToken(@Path("token") token: String): Response<InvitationDto>

    @POST("invitations/{token}/accept")
    suspend fun acceptInvitation(@Path("token") token: String): Response<Unit>
}

data class InvitationDto(
    val id: String,
    val email: String,
    val token: String,
    val role: String,
    val workspaceId: String?,
    val channelId: String?,
    val inviterId: String,
    val expiresAt: String?,
    val createdAt: String
)

data class CreateInvitationRequest(
    val email: String,
    val role: String? = null,
    val workspaceId: String? = null,
    val channelId: String? = null
)
