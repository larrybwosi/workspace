package com.scrymechat.android.data.remote

data class MessageDto(
    val id: String,
    val content: String,
    val channelId: String? = null,
    val dmId: String? = null,
    val authorId: String? = null,
    val senderId: String? = null,
    val userId: String? = null, // Backend often aliases senderId to userId in formatted responses
    val createdAt: String,
    val updatedAt: String,
    val author: UserDto? = null,
    val user: UserDto? = null, // Backend often aliases author to user
    val attachments: List<AttachmentDto> = emptyList(),
    val metadata: Map<String, Any>? = null,
    val reactions: List<ReactionGroupDto> = emptyList(),
    val isEdited: Boolean = false,
    val replyToId: String? = null,
    val replyTo: ReplyToDto? = null,
    val readByCurrentUser: Boolean = false
)

data class AttachmentDto(
    val id: String,
    val name: String,
    val url: String,
    val type: String,
    val size: Int
)

data class ReactionGroupDto(
    val emoji: String,
    val count: Int,
    val users: List<String>
)

data class ReactionDto(
    val id: String? = null,
    val messageId: String,
    val userId: String,
    val emoji: String
)

data class ReplyToDto(
    val id: String,
    val sender: ReplyToUserDto?
)

data class ReplyToUserDto(
    val id: String,
    val name: String
)

data class SendMessageRequest(
    val content: String,
    val replyToId: String? = null,
    val attachments: List<CreateAttachmentRequest>? = null
)

data class CreateAttachmentRequest(
    val name: String,
    val type: String,
    val url: String,
    val size: Int
)

data class UpdateMessageRequest(
    val content: String
)

data class MessagesResponse(
    val messages: List<MessageDto>,
    val nextCursor: String?,
    val hasMore: Boolean
)
