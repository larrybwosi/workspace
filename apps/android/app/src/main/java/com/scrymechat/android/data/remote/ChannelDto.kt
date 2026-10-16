package com.scrymechat.android.data.remote

data class ChannelDto(
    val id: String,
    val name: String,
    val slug: String? = null,
    val type: String? = null,
    val description: String? = null,
    val icon: String? = null,
    val workspaceId: String? = null,
    val parentId: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val members: List<ChannelMemberDto>? = null,
    val _count: ChannelCountDto? = null,
    val unreadCount: Int? = null,
    val mentionCount: Int? = null
)

data class ChannelMemberDto(
    val userId: String,
    val role: String,
    val user: UserDto?
)

data class ChannelCountDto(
    val messages: Int? = null,
    val members: Int? = null,
    val threads: Int? = null
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

data class AddChannelMembersRequest(
    val userIds: List<String>
)
