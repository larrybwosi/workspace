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
    val bio: String?,
    val role: String,
    val status: String,
    val jobTitle: String? = null,
    val department: String? = null,
    val officeLocation: String? = null,
    val managerId: String? = null,
    val managerName: String? = null,
    val managerTitle: String? = null,
    val managerAvatar: String? = null,
    val github: String? = null,
    val slack: String? = null
)
