package com.scrymechat.android.data.repository

import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.dao.ChannelDao
import com.scrymechat.android.data.local.entities.ChannelEntity
import com.scrymechat.android.data.remote.ChannelApi
import com.scrymechat.android.data.remote.ChannelDto
import com.scrymechat.android.data.remote.CreateChannelRequest
import com.scrymechat.android.data.remote.UpdateChannelRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChannelRepository @Inject constructor(
    private val api: ChannelApi,
    private val dao: ChannelDao
) {
    fun getWorkspaceChannels(slug: String): Flow<Resource<List<ChannelEntity>>> = flow {
        emit(Resource.Loading())
        try {
            val response = api.getWorkspaceChannels(slug)
            if (response.isSuccessful) {
                val dtos = response.body() ?: emptyList()
                val entities = dtos.map { it.toEntity() }
                // We might want to clear old channels for this workspace first if needed
                // But for now, we just insert/replace
                dao.insertChannels(entities)
                emit(Resource.Success(entities))
            } else {
                emit(Resource.Error(response.message()))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An unknown error occurred"))
        }
    }

    suspend fun createChannel(slug: String, request: CreateChannelRequest): Resource<ChannelEntity> {
        return try {
            val response = api.createChannel(slug, request)
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertChannel(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun getChannel(channelId: String): ChannelEntity? {
        return dao.getChannelById(channelId)
    }

    suspend fun updateChannel(slug: String, channelId: String, request: UpdateChannelRequest): Resource<ChannelEntity> {
        return try {
            val response = api.updateChannel(slug, channelId, request)
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertChannel(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun deleteChannel(slug: String, channelId: String): Resource<Unit> {
        return try {
            val response = api.deleteChannel(slug, channelId)
            if (response.isSuccessful) {
                dao.deleteChannelById(channelId)
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    private fun ChannelDto.toEntity() = ChannelEntity(
        id = id,
        name = name,
        slug = slug,
        type = type,
        description = description,
        icon = icon,
        workspaceId = workspaceId,
        parentId = parentId,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
