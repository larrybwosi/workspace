package com.scrymechat.android.data.remote

data class SocketEvent<T>(
    val event: String,
    val data: T
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
