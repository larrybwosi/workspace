package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "friends")
data class FriendEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val friendId: String,
    val createdAt: String
)
