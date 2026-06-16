package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "workspaces")
data class WorkspaceEntity(
    @PrimaryKey val id: String,
    val name: String,
    val slug: String,
    val icon: String?,
    val description: String?,
    val ownerId: String,
    val createdAt: String,
    val isPublic: Boolean,
    val customDomain: String?,
    val industry: String?
)
