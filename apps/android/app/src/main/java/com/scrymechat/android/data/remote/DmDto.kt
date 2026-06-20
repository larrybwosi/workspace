package com.scrymechat.android.data.remote

data class DmConversationDto(
    val id: String,
    val creatorId: String?,
    val members: List<UserDto>,
    val user: UserDto, // The other user in the DM
    val lastMessage: DmLastMessageDto?,
    val _count: DmCountDto?,
    val lastMessageAt: String
)

data class DmLastMessageDto(
    val content: String,
    val createdAt: String,
    val timestamp: String,
    val userId: String
)

data class DmCountDto(
    val messages: Int,
    val unreadCount: Int? = null,
    val mentionCount: Int? = null
)

data class CreateDmRequest(
    val userId: String
)
