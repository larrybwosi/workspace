package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.*

interface FriendsApi {
    @GET("friends")
    suspend fun getFriends(@Query("search") search: String? = null): Response<FriendsResponse>

    @GET("friends/requests")
    suspend fun getFriendRequests(
        @Query("type") type: String? = null,
        @Query("status") status: String? = null
    ): Response<FriendRequestsResponse>

    @POST("friends/requests")
    suspend fun sendFriendRequest(@Body request: SendFriendRequestDto): Response<FriendRequestDto>

    @PATCH("friends/requests/{requestId}")
    suspend fun updateFriendRequest(
        @Path("requestId") requestId: String,
        @Body request: UpdateFriendRequestDto
    ): Response<FriendRequestDto>

    @DELETE("friends/requests/{requestId}")
    suspend fun deleteFriendRequest(@Path("requestId") requestId: String): Response<Unit>
}

data class FriendsResponse(
    val friends: List<FriendDto>
)

data class FriendDto(
    val id: String,
    val userId: String,
    val friendId: String,
    val friend: UserDto,
    val createdAt: String
)

data class FriendRequestsResponse(
    val requests: List<FriendRequestDto>
)

data class FriendRequestDto(
    val id: String,
    val senderId: String,
    val receiverId: String,
    val status: String,
    val message: String?,
    val sender: UserDto?,
    val receiver: UserDto?,
    val createdAt: String
)

data class SendFriendRequestDto(
    val receiverId: String,
    val message: String? = null
)

data class UpdateFriendRequestDto(
    val action: String // 'accept' | 'decline' | 'cancel'
)
