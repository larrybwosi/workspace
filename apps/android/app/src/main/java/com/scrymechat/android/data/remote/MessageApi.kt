package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.*

interface MessageApi {
    // Channel Messages
    @GET("channels/{channelId}/messages")
    suspend fun getChannelMessages(
        @Path("channelId") channelId: String,
        @Query("cursor") cursor: String? = null,
        @Query("limit") limit: Int = 50
    ): Response<MessagesResponse>

    @POST("channels/{channelId}/messages")
    suspend fun sendChannelMessage(
        @Path("channelId") channelId: String,
        @Body request: SendMessageRequest
    ): Response<MessageDto>

    @PATCH("channels/{channelId}/messages/{messageId}")
    suspend fun updateChannelMessage(
        @Path("channelId") channelId: String,
        @Path("messageId") messageId: String,
        @Body request: UpdateMessageRequest
    ): Response<MessageDto>

    @DELETE("channels/{channelId}/messages/{messageId}")
    suspend fun deleteChannelMessage(
        @Path("channelId") channelId: String,
        @Path("messageId") messageId: String
    ): Response<Unit>

    @POST("channels/{channelId}/messages/{messageId}/reactions")
    suspend fun addChannelReaction(
        @Path("channelId") channelId: String,
        @Path("messageId") messageId: String,
        @Body request: Map<String, String> // { "emoji": "👍" }
    ): Response<ReactionDto>

    @DELETE("channels/{channelId}/messages/{messageId}/reactions/{emoji}")
    suspend fun removeChannelReaction(
        @Path("channelId") channelId: String,
        @Path("messageId") messageId: String,
        @Path("emoji") emoji: String
    ): Response<Unit>

    // DM Messages
    @GET("dms/{conversationId}/messages")
    suspend fun getDmMessages(
        @Path("conversationId") conversationId: String,
        @Query("cursor") cursor: String? = null,
        @Query("limit") limit: Int = 50
    ): Response<MessagesResponse>

    @POST("dms/{conversationId}/messages")
    suspend fun sendDmMessage(
        @Path("conversationId") conversationId: String,
        @Body request: SendMessageRequest
    ): Response<MessageDto>

    @PATCH("dms/{conversationId}/messages/{messageId}")
    suspend fun updateDmMessage(
        @Path("conversationId") conversationId: String,
        @Path("messageId") messageId: String,
        @Body request: UpdateMessageRequest
    ): Response<MessageDto>

    @DELETE("dms/{conversationId}/messages/{messageId}")
    suspend fun deleteDmMessage(
        @Path("conversationId") conversationId: String,
        @Path("messageId") messageId: String
    ): Response<Unit>

    @POST("dms/{conversationId}/messages/{messageId}/reactions")
    suspend fun addDmReaction(
        @Path("conversationId") conversationId: String,
        @Path("messageId") messageId: String,
        @Body request: Map<String, String>
    ): Response<ReactionDto>

    @DELETE("dms/{conversationId}/messages/{messageId}/reactions/{emoji}")
    suspend fun removeDmReaction(
        @Path("conversationId") conversationId: String,
        @Path("messageId") messageId: String,
        @Path("emoji") emoji: String
    ): Response<Unit>

    @POST("v2/messages/{messageId}/actions/{actionId}")
    suspend fun triggerMessageAction(
        @Path("messageId") messageId: String,
        @Path("actionId") actionId: String,
        @Body payload: Map<String, Any>
    ): Response<Map<String, Any>>
}
