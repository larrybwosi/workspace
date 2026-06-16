package com.scrymechat.android.data.repository

import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.dao.MessageDao
import com.scrymechat.android.data.local.entities.MessageEntity
import com.scrymechat.android.data.remote.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val api: MessageApi,
    private val dao: MessageDao
) {
    fun getChannelMessages(channelId: String, cursor: String? = null): Flow<Resource<List<MessageEntity>>> = flow {
        emit(Resource.Loading())
        try {
            val response = api.getChannelMessages(channelId, cursor)
            if (response.isSuccessful) {
                val dtos = response.body()?.messages ?: emptyList()
                val entities = dtos.map { it.toEntity() }
                dao.insertMessages(entities)
                emit(Resource.Success(entities))
            } else {
                emit(Resource.Error(response.message()))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An unknown error occurred"))
        }
    }

    suspend fun sendChannelMessage(channelId: String, content: String, replyToId: String? = null): Resource<MessageEntity> {
        return try {
            val response = api.sendChannelMessage(channelId, SendMessageRequest(content, replyToId))
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

    suspend fun updateChannelMessage(channelId: String, messageId: String, content: String): Resource<MessageEntity> {
        return try {
            val response = api.updateChannelMessage(channelId, messageId, UpdateMessageRequest(content))
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

    suspend fun deleteChannelMessage(channelId: String, messageId: String): Resource<Unit> {
        return try {
            val response = api.deleteChannelMessage(channelId, messageId)
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
        try {
            val response = api.getDmMessages(conversationId, cursor)
            if (response.isSuccessful) {
                val dtos = response.body()?.messages ?: emptyList()
                val entities = dtos.map { it.toEntity() }
                dao.insertMessages(entities)
                emit(Resource.Success(entities))
            } else {
                emit(Resource.Error(response.message()))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An unknown error occurred"))
        }
    }

    suspend fun sendDmMessage(conversationId: String, content: String, replyToId: String? = null): Resource<MessageEntity> {
        return try {
            val response = api.sendDmMessage(conversationId, SendMessageRequest(content, replyToId))
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

    suspend fun addReaction(targetId: String, messageId: String, emoji: String, isChannel: Boolean): Resource<Unit> {
        return try {
            val response = if (isChannel) {
                api.addChannelReaction(targetId, messageId, mapOf("emoji" to emoji))
            } else {
                api.addDmReaction(targetId, messageId, mapOf("emoji" to emoji))
            }
            if (response.isSuccessful) {
                // Here we might want to refresh the message in local DB to show the new reaction
                // For now, we just return success
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun removeReaction(targetId: String, messageId: String, emoji: String, isChannel: Boolean): Resource<Unit> {
        return try {
            val response = if (isChannel) {
                api.removeChannelReaction(targetId, messageId, emoji)
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

    private fun MessageDto.toEntity() = MessageEntity(
        id = id,
        content = content,
        channelId = channelId,
        dmId = dmId,
        senderId = senderId ?: authorId ?: userId ?: "",
        createdAt = createdAt,
        updatedAt = updatedAt,
        isEdited = isEdited,
        replyToId = replyToId,
        readByCurrentUser = readByCurrentUser
    )
}
