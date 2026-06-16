package com.scrymechat.android.data.repository

import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.dao.DmDao
import com.scrymechat.android.data.local.entities.DmConversationEntity
import com.scrymechat.android.data.remote.CreateDmRequest
import com.scrymechat.android.data.remote.DmApi
import com.scrymechat.android.data.remote.DmConversationDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DmRepository @Inject constructor(
    private val api: DmApi,
    private val dao: DmDao
) {
    fun getDms(): Flow<Resource<List<DmConversationEntity>>> = flow {
        emit(Resource.Loading())
        try {
            val response = api.getDms()
            if (response.isSuccessful) {
                val dtos = response.body() ?: emptyList()
                val entities = dtos.map { it.toEntity() }
                dao.insertDms(entities)
                emit(Resource.Success(entities))
            } else {
                emit(Resource.Error(response.message()))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An unknown error occurred"))
        }
    }

    suspend fun createDm(userId: String): Resource<DmConversationEntity> {
        return try {
            val response = api.createDm(CreateDmRequest(userId))
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertDm(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun deleteDm(conversationId: String): Resource<Unit> {
        return try {
            val response = api.deleteDm(conversationId)
            if (response.isSuccessful) {
                dao.deleteDmById(conversationId)
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    private fun DmConversationDto.toEntity() = DmConversationEntity(
        id = id,
        creatorId = creatorId,
        otherUserId = user.id,
        lastMessageAt = lastMessageAt
    )
}
