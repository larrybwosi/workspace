package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val username: String?,
    val email: String,
    val avatar: String?,
    val banner: String?,
    val statusText: String?,
    val statusEmoji: String?,
    val role: String,
    val status: String
)
