package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val type: String,
    val title: String,
    val message: String,
    val entityType: String?,
    val entityId: String?,
    val linkUrl: String?,
    val isRead: Boolean,
    val metadata: Map<String, Any>?,
    val createdAt: String
)
