package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.*

interface ChannelApi {
    @GET("workspaces/{slug}/channels")
    suspend fun getWorkspaceChannels(@Path("slug") slug: String): Response<List<ChannelDto>>

    @POST("workspaces/{slug}/channels")
    suspend fun createChannel(
        @Path("slug") slug: String,
        @Body request: CreateChannelRequest
    ): Response<ChannelDto>

    @GET("workspaces/{slug}/channels/{channelId}")
    suspend fun getChannel(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String
    ): Response<ChannelDto>

    @PATCH("workspaces/{slug}/channels/{channelId}")
    suspend fun updateChannel(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Body request: UpdateChannelRequest
    ): Response<ChannelDto>

    @DELETE("workspaces/{slug}/channels/{channelId}")
    suspend fun deleteChannel(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String
    ): Response<Unit>

    @GET("workspaces/{slug}/channels/{channelId}/members")
    suspend fun getChannelMembers(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String
    ): Response<List<ChannelMemberDto>>

    @POST("workspaces/{slug}/channels/{channelId}/members")
    suspend fun addChannelMembers(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Body request: AddChannelMembersRequest
    ): Response<List<ChannelMemberDto>>

    @DELETE("workspaces/{slug}/channels/{channelId}/members/{userId}")
    suspend fun removeChannelMember(
        @Path("slug") slug: String,
        @Path("channelId") channelId: String,
        @Path("userId") userId: String
    ): Response<Unit>
}
