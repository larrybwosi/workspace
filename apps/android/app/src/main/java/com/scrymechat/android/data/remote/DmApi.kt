package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.*

interface DmApi {
    @GET("dms")
    suspend fun getDms(): Response<List<DmConversationDto>>

    @POST("dms")
    suspend fun createDm(@Body request: CreateDmRequest): Response<DmConversationDto>

    @GET("dms/{conversationId}")
    suspend fun getDm(@Path("conversationId") conversationId: String): Response<DmConversationDto>

    @DELETE("dms/{conversationId}")
    suspend fun deleteDm(@Path("conversationId") conversationId: String): Response<Unit>
}
