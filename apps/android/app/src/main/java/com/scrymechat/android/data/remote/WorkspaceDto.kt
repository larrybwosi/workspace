package com.scrymechat.android.data.remote

data class WorkspaceDto(
    val id: String,
    val name: String,
    val slug: String,
    val icon: String?,
    val description: String?,
    val ownerId: String,
    val createdAt: String,
    val isPublic: Boolean,
    val customDomain: String?,
    val brandingConfig: Map<String, Any>?,
    val industry: String?,
    val owner: UserDto?,
    val _count: WorkspaceCountDto?
)

data class WorkspaceCountDto(
    val members: Int,
    val channels: Int
)

data class CreateWorkspaceRequest(
    val name: String,
    val slug: String,
    val icon: String? = null,
    val description: String? = null,
    val isPublic: Boolean? = null,
    val industry: String? = null
)

data class UpdateWorkspaceRequest(
    val name: String? = null,
    val icon: String? = null,
    val description: String? = null,
    val settings: Map<String, Any>? = null,
    val plan: String? = null,
    val isPublic: Boolean? = null,
    val customDomain: String? = null,
    val brandingConfig: Map<String, Any>? = null,
    val industry: String? = null
)
