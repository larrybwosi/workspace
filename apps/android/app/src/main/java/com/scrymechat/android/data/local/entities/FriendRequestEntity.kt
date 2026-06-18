package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "friend_requests")
data class FriendRequestEntity(
    @PrimaryKey val id: String,
    val senderId: String,
    val receiverId: String,
    val status: String,
    val message: String?,
    val createdAt: String
)
