package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "dm_conversations")
data class DmConversationEntity(
    @PrimaryKey val id: String,
    val creatorId: String?,
    val otherUserId: String,
    val lastMessageAt: String,
    val unreadCount: Int = 0
)
