package com.scrymechat.android.data.remote

data class ChannelDto(
    val id: String,
    val name: String,
    val slug: String,
    val type: String, // 'public' or 'private'
    val description: String?,
    val icon: String?,
    val workspaceId: String,
    val parentId: String?,
    val createdAt: String,
    val updatedAt: String,
    val members: List<ChannelMemberDto>?,
    val _count: ChannelCountDto?
)

data class ChannelMemberDto(
    val userId: String,
    val role: String,
    val user: UserDto?
)

data class ChannelCountDto(
    val messages: Int? = null,
    val members: Int? = null,
    val threads: Int? = null,
    val unreadCount: Int? = null,
    val mentionCount: Int? = null
)

data class CreateChannelRequest(
    val name: String,
    val description: String? = null,
    val type: String = "public",
    val departmentId: String? = null,
    val icon: String? = null
)

data class UpdateChannelRequest(
    val name: String? = null,
    val description: String? = null,
    val type: String? = null,
    val icon: String? = null
)
