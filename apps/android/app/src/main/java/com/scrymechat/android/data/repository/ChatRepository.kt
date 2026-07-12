package com.scrymechat.android.data.repository

import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.dao.MessageDao
import com.scrymechat.android.data.local.dao.ChannelDao
import com.scrymechat.android.data.local.dao.DmDao
import com.scrymechat.android.data.local.entities.MessageEntity
import com.scrymechat.android.data.remote.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val api: MessageApi,
    private val dao: MessageDao,
    private val channelDao: ChannelDao,
    private val dmDao: DmDao
) {
    fun getChannelMessages(workspaceSlug: String, channelId: String, cursor: String? = null): Flow<Resource<List<MessageEntity>>> = flow {
        emit(Resource.Loading())
        val result = try {
            val response = api.getChannelMessages(workspaceSlug, channelId, cursor)
            if (response.isSuccessful) {
                val dtos = response.body()?.messages ?: emptyList()
                val entities = dtos.map { it.toEntity() }
                dao.insertMessages(entities)
                Resource.Success(entities)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            Resource.Error(e.message ?: "An unknown error occurred")
        }
        emit(result)
    }

    fun getChannelMessagesFlow(channelId: String): Flow<List<MessageEntity>> = dao.getMessagesForChannelFlow(channelId)
        .map { it.processCustomMessages() }

    fun getThreadMessagesFlow(threadId: String): Flow<List<MessageEntity>> = dao.getMessagesForThreadFlow(threadId)
        .map { it.processCustomMessages() }

    private fun List<MessageEntity>.processCustomMessages(): List<MessageEntity> {
        return this.onEach { message ->
            if (message.customMessage == null && (message.messageType == "custom" || message.messageType == "approval" || message.messageType == "report")) {
                try {
                    val json = com.google.gson.Gson().toJson(message.metadata)
                    message.customMessage = com.google.gson.Gson().fromJson(json, CustomMessageDto::class.java)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    suspend fun sendChannelMessage(workspaceSlug: String, channelId: String, content: String, replyToId: String? = null, attachments: List<CreateAttachmentRequest>? = null): Resource<MessageEntity> {
        return try {
            val response = api.sendChannelMessage(workspaceSlug, channelId, SendMessageRequest(content, replyToId, attachments))
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertMessage(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun sendThreadMessage(workspaceSlug: String, channelId: String, threadId: String, content: String, attachments: List<CreateAttachmentRequest>? = null): Resource<MessageEntity> {
        return try {
            val response = api.sendThreadMessage(workspaceSlug, channelId, threadId, SendMessageRequest(content, null, attachments))
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertMessage(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun triggerAction(slug: String, messageId: String, actionId: String, body: Map<String, Any>): Resource<Map<String, Any>> {
        return try {
            val response = api.triggerMessageAction(slug, messageId, actionId, body)
            if (response.isSuccessful && response.body() != null) {
                val responseBody = response.body()!!
                if (responseBody.containsKey("message")) {
                    try {
                        val gson = com.google.gson.Gson()
                        val messageJson = gson.toJson(responseBody["message"])
                        val messageDto = gson.fromJson(messageJson, MessageDto::class.java)
                        val entity = messageDto.toEntity()
                        dao.insertMessage(entity)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                Resource.Success(responseBody)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun updateChannelMessage(workspaceSlug: String, channelId: String, messageId: String, content: String): Resource<MessageEntity> {
        return try {
            val response = api.updateChannelMessage(workspaceSlug, channelId, messageId, UpdateMessageRequest(content))
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertMessage(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun updateDmMessage(conversationId: String, messageId: String, content: String): Resource<MessageEntity> {
        return try {
            val response = api.updateDmMessage(conversationId, messageId, UpdateMessageRequest(content))
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertMessage(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun deleteChannelMessage(workspaceSlug: String, channelId: String, messageId: String): Resource<Unit> {
        return try {
            val response = api.deleteChannelMessage(workspaceSlug, channelId, messageId)
            if (response.isSuccessful) {
                dao.deleteMessageById(messageId)
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun deleteDmMessage(conversationId: String, messageId: String): Resource<Unit> {
        return try {
            val response = api.deleteDmMessage(conversationId, messageId)
            if (response.isSuccessful) {
                dao.deleteMessageById(messageId)
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    fun getDmMessages(conversationId: String, cursor: String? = null): Flow<Resource<List<MessageEntity>>> = flow {
        emit(Resource.Loading())
        val result = try {
            val response = api.getDmMessages(conversationId, cursor)
            if (response.isSuccessful) {
                val dtos = response.body()?.messages ?: emptyList()
                val entities = dtos.map { it.toEntity() }
                dao.insertMessages(entities)
                Resource.Success(entities)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            Resource.Error(e.message ?: "An unknown error occurred")
        }
        emit(result)
    }

    fun getDmMessagesFlow(dmId: String): Flow<List<MessageEntity>> = dao.getMessagesForDmFlow(dmId)
        .map { it.processCustomMessages() }

    fun getThreadMessages(workspaceSlug: String, channelId: String, threadId: String): Flow<Resource<List<MessageEntity>>> = flow {
        emit(Resource.Loading())
        val result = try {
            val response = api.getThreadMessages(workspaceSlug, channelId, threadId)
            if (response.isSuccessful) {
                val dtos = response.body()?.messages ?: emptyList()
                val entities = dtos.map { it.toEntity() }
                dao.insertMessages(entities)
                Resource.Success(entities)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            Resource.Error(e.message ?: "An unknown error occurred")
        }
        emit(result)
    }

    suspend fun sendDmMessage(conversationId: String, content: String, replyToId: String? = null, attachments: List<CreateAttachmentRequest>? = null): Resource<MessageEntity> {
        return try {
            val response = api.sendDmMessage(conversationId, SendMessageRequest(content, replyToId, attachments))
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertMessage(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun markDmRead(dmId: String): Resource<Unit> {
        return try {
            val unreadIds = dao.getUnreadMessageIdsForDm(dmId)
            if (unreadIds.isNotEmpty()) {
                val response = api.markDmRead(dmId, mapOf("messageIds" to unreadIds))
                if (response.isSuccessful) {
                    dao.markDmMessagesAsRead(dmId)
                    dmDao.clearUnreadCount(dmId)
                    Resource.Success(Unit)
                } else {
                    Resource.Error(response.message())
                }
            } else {
                dao.markDmMessagesAsRead(dmId)
                dmDao.clearUnreadCount(dmId)
                Resource.Success(Unit)
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun markChannelRead(workspaceSlug: String, channelId: String): Resource<Unit> {
        return try {
            val unreadIds = dao.getUnreadMessageIdsForChannel(channelId)
            if (unreadIds.isNotEmpty()) {
                val response = api.markChannelRead(workspaceSlug, channelId, mapOf("messageIds" to unreadIds))
                if (response.isSuccessful) {
                    dao.markChannelMessagesAsRead(channelId)
                    channelDao.clearUnreadCount(channelId)
                    Resource.Success(Unit)
                } else {
                    Resource.Error(response.message())
                }
            } else {
                dao.markChannelMessagesAsRead(channelId)
                channelDao.clearUnreadCount(channelId)
                Resource.Success(Unit)
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun addReaction(workspaceSlug: String?, targetId: String, messageId: String, emoji: String, isChannel: Boolean): Resource<Unit> {
        return try {
            val response = if (isChannel && workspaceSlug != null) {
                api.addChannelReaction(workspaceSlug, targetId, messageId, mapOf("emoji" to emoji))
            } else {
                api.addDmReaction(targetId, messageId, mapOf("emoji" to emoji))
            }
            if (response.isSuccessful) {
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun removeReaction(workspaceSlug: String?, targetId: String, messageId: String, emoji: String, isChannel: Boolean): Resource<Unit> {
        return try {
            val response = if (isChannel && workspaceSlug != null) {
                api.removeChannelReaction(workspaceSlug, targetId, messageId, emoji)
            } else {
                api.removeDmReaction(targetId, messageId, emoji)
            }
            if (response.isSuccessful) {
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }
<<<<<<< HEAD
=======

    private fun MessageDto.toEntity(): MessageEntity {
        val type = (metadata?.get("type") as? String) ?: "standard"
        val entity = MessageEntity(
            id = id,
            content = content,
            channelId = channelId,
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
                entity.customMessage = com.google.gson.Gson().fromJson(json, CustomMessageDto::class.java)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        return entity
    }
>>>>>>> main
}
