package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "workspace_members")
data class WorkspaceMemberEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val userId: String,
    val role: String,
    val permissions: Long,
    val memberType: String
)
