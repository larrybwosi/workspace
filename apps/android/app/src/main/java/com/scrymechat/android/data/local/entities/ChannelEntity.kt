package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "channels")
data class ChannelEntity(
    @PrimaryKey val id: String,
    val name: String,
    val slug: String,
    val type: String,
    val description: String?,
    val icon: String?,
    val workspaceId: String,
    val parentId: String?,
    val createdAt: String,
    val updatedAt: String,
    val unreadCount: Int = 0,
    val mentionCount: Int = 0
)
