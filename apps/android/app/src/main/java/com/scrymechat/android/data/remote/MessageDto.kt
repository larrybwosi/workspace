package com.scrymechat.android.data.remote

data class MessageDto(
    val id: String,
    val content: String,
    val channelId: String? = null,
    val dmId: String? = null,
    val authorId: String? = null,
    val senderId: String? = null,
    val userId: String? = null, // Backend often aliases senderId to userId in formatted responses
    val createdAt: String? = null,
    val timestamp: String? = null, // Workspace messages use timestamp instead of createdAt
    val updatedAt: String? = null,
    val author: UserDto? = null,
    val user: UserDto? = null, // Backend often aliases author to user
    val attachments: List<AttachmentDto> = emptyList(),
    val metadata: Map<String, Any>? = null,
    val reactions: List<ReactionGroupDto> = emptyList(),
    val isEdited: Boolean = false,
    val replyToId: String? = null,
    val replyTo: ReplyToDto? = null,
    val readByCurrentUser: Boolean = false,
    val threadId: String? = null,
    val replyCount: Int = 0,
    val isPinned: Boolean = false
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

fun MessageDto.toEntity(): com.scrymechat.android.data.local.entities.MessageEntity {
    val type = (metadata?.get("type") as? String) ?: "standard"
    val entity = com.scrymechat.android.data.local.entities.MessageEntity(
        id = id,
        content = content,
        channelId = channelId ?: "",
        dmId = dmId,
        senderId = senderId ?: authorId ?: userId ?: "",
        senderName = user?.name ?: author?.name ?: user?.username ?: author?.username,
        senderAvatar = user?.avatar ?: author?.avatar ?: user?.image ?: author?.image,
        createdAt = createdAt ?: timestamp ?: "",
        updatedAt = updatedAt ?: createdAt ?: timestamp ?: "",
        isEdited = isEdited,
        replyToId = replyToId,
        replyToSenderName = replyTo?.sender?.name,
        readByCurrentUser = readByCurrentUser,
        attachments = attachments,
        metadata = metadata,
        reactions = reactions,
        messageType = type,
        threadId = threadId,
        replyCount = replyCount,
        isPinned = isPinned,
        senderRole = user?.role ?: author?.role
    )

    if (type == "custom" || type == "approval" || type == "report") {
        try {
            val json = com.google.gson.Gson().toJson(metadata)
            entity.customMessage = com.google.gson.Gson().fromJson(json, com.scrymechat.android.data.remote.CustomMessageDto::class.java)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    return entity
}
