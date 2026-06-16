package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String,
    val content: String,
    val channelId: String?,
    val dmId: String?,
    val senderId: String,
    val createdAt: String,
    val updatedAt: String,
    val isEdited: Boolean,
    val replyToId: String?,
    val readByCurrentUser: Boolean
)
