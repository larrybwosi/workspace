package com.scrymechat.android.data.remote

data class SocketEvent<T>(
    val event: String,
    val data: T
)

data class MessageDto(
    val id: String,
    val content: String,
    val channelId: String,
    val authorId: String,
    val createdAt: String,
    val updatedAt: String,
    val author: UserDto,
    val attachments: List<AttachmentDto> = emptyList(),
    val metadata: Map<String, Any>? = null
)

data class AttachmentDto(
    val id: String,
    val name: String,
    val url: String,
    val type: String,
    val size: Int
)

data class PresenceDto(
    val userId: String,
    val channel: String,
    val data: Map<String, Any>? = null
)

data class NotificationDto(
    val id: String,
    val title: String,
    val body: String,
    val type: String,
    val metadata: Map<String, Any>? = null
)
