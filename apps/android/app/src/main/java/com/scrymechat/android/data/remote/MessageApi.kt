package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.*

interface MessageApi {
    // Channel Messages
    @GET("workspaces/{slug}/channels/{channelId}/messages")
    suspend fun getChannelMessages(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Query("cursor") cursor: String? = null,
        @Query("limit") limit: Int = 50
    ): Response<MessagesResponse>

    @POST("workspaces/{slug}/channels/{channelId}/messages")
    suspend fun sendChannelMessage(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Body request: SendMessageRequest
    ): Response<MessageDto>

    @PATCH("workspaces/{slug}/channels/{channelId}/messages/{messageId}")
    suspend fun updateChannelMessage(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Path("messageId") messageId: String,
        @Body request: UpdateMessageRequest
    ): Response<MessageDto>

    @DELETE("workspaces/{slug}/channels/{channelId}/messages/{messageId}")
    suspend fun deleteChannelMessage(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Path("messageId") messageId: String
    ): Response<Unit>

    @POST("workspaces/{slug}/channels/{channelId}/messages/{messageId}/reactions")
    suspend fun addChannelReaction(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Path("messageId") messageId: String,
        @Body request: Map<String, String> // { "emoji": "👍" }
    ): Response<ReactionDto>

    @DELETE("workspaces/{slug}/channels/{channelId}/messages/{messageId}/reactions/{emoji}")
    suspend fun removeChannelReaction(
        @Path("slug") slug: String,
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

    @POST("dms/{conversationId}/read")
    suspend fun markDmRead(
        @Path("conversationId") conversationId: String
    ): Response<Unit>

    @POST("workspaces/{slug}/channels/{channelId}/read")
    suspend fun markChannelRead(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String
    ): Response<Unit>

    @POST("v2/workspaces/{slug}/messages/{messageId}/actions/{actionId}")
    suspend fun triggerMessageAction(
        @Path("slug") slug: String,
        @Path("messageId") messageId: String,
        @Path("actionId") actionId: String,
        @Body body: Map<String, Any>
    ): Response<Map<String, Any>>

    // Thread Messages
    @GET("workspaces/{slug}/channels/{channelId}/messages")
    suspend fun getThreadMessages(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Query("threadId") threadId: String,
        @Query("limit") limit: Int = 50
    ): Response<MessagesResponse>

    @POST("workspaces/{slug}/channels/{channelId}/messages")
    suspend fun sendThreadMessage(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Query("threadId") threadId: String,
        @Body request: SendMessageRequest
    ): Response<MessageDto>
}
