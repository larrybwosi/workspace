package com.scrymechat.android.data.remote

data class SocketEvent<T>(
    val event: String,
    val data: T
)

data class PresenceDto(
    val userId: String,
    val channel: String?,
    val data: Map<String, Any>? = null
)

data class NotificationDto(
    val id: String,
    val userId: String,
    val title: String,
    val message: String,
    val type: String,
    val entityType: String? = null,
    val entityId: String? = null,
    val linkUrl: String? = null,
    val isRead: Boolean = false,
    val metadata: Map<String, Any>? = null,
    val createdAt: String
)

data class UpdateNotificationRequest(
    val isRead: Boolean
)
