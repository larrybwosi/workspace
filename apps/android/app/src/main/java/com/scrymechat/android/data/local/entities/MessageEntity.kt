package com.scrymechat.android.data.local.entities

import androidx.room.Entity
import androidx.room.Ignore
import androidx.room.PrimaryKey
import com.scrymechat.android.data.remote.AttachmentDto
import com.scrymechat.android.data.remote.CustomMessageDto
import com.scrymechat.android.data.remote.ReactionGroupDto

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String,
    val content: String,
    val channelId: String?,
    val dmId: String?,
    val senderId: String,
    val senderName: String? = null,
    val senderAvatar: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val isEdited: Boolean,
    val replyToId: String?,
    val replyToSenderName: String? = null,
    val readByCurrentUser: Boolean,
    val attachments: List<AttachmentDto> = emptyList(),
    val metadata: Map<String, Any>? = null,
    val reactions: List<ReactionGroupDto> = emptyList(),
    val messageType: String? = null,
    val threadId: String? = null,
    val replyCount: Int = 0,
    val isPinned: Boolean = false,
    val senderRole: String? = null,
    val forwardedMessages: List<ForwardedSnapshot> = emptyList()
) {
    @Ignore
    var customMessage: CustomMessageDto? = null
}

data class ForwardedSnapshot(
    val id: String,
    val senderName: String?,
    val senderAvatar: String?,
    val content: String,
    val createdAt: String,
    val attachments: List<AttachmentDto> = emptyList(),
    val messageType: String = "text"
)
