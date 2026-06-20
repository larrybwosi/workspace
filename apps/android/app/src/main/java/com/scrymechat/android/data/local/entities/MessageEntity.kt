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
    val isDelivered: Boolean = true, // Default to true since it's locally saved
    val isReadByOthers: Boolean = false,
    val attachments: List<AttachmentDto> = emptyList(),
    val metadata: Map<String, Any>? = null,
    val reactions: List<ReactionGroupDto> = emptyList(),
    val messageType: String? = null
) {
    @Ignore
    var customMessage: CustomMessageDto? = null
}
