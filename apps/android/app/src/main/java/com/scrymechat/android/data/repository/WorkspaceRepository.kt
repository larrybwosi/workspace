package com.scrymechat.android.data.repository

import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.dao.WorkspaceDao
import com.scrymechat.android.data.local.entities.WorkspaceEntity
import com.scrymechat.android.data.remote.CreateWorkspaceRequest
import com.scrymechat.android.data.remote.UpdateWorkspaceRequest
import com.scrymechat.android.data.remote.WorkspaceApi
import com.scrymechat.android.data.remote.WorkspaceDto
import com.scrymechat.android.data.remote.WorkspaceMemberWithUserDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WorkspaceRepository @Inject constructor(
    private val api: WorkspaceApi,
    private val dao: WorkspaceDao
) {
    fun getWorkspaces(): Flow<Resource<List<WorkspaceEntity>>> = flow {
        emit(Resource.Loading())
        val result = try {
            val response = api.getWorkspaces()
            if (response.isSuccessful) {
                val dtos = response.body() ?: emptyList()
                val entities = dtos.map { it.toEntity() }
                dao.insertWorkspaces(entities)
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

    suspend fun getWorkspaceBySlug(slug: String): WorkspaceEntity? {
        return dao.getWorkspaceBySlug(slug)
    }

    suspend fun createWorkspace(request: CreateWorkspaceRequest): Resource<WorkspaceEntity> {
        return try {
            val response = api.createWorkspace(request)
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertWorkspace(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun getWorkspaceMembers(slug: String): Resource<List<WorkspaceMemberWithUserDto>> {
        return try {
            val response = api.getWorkspaceMembers(slug)
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!.members)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun updateWorkspace(slug: String, request: UpdateWorkspaceRequest): Resource<WorkspaceEntity> {
        return try {
            val response = api.updateWorkspace(slug, request)
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                dao.insertWorkspace(entity)
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun deleteWorkspace(slug: String): Resource<Unit> {
        return try {
            val response = api.deleteWorkspace(slug)
            if (response.isSuccessful) {
                val workspace = dao.getWorkspaceBySlug(slug)
                if (workspace != null) {
                    dao.deleteWorkspace(workspace)
                }
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    fun discoverWorkspaces(query: String? = null): Flow<Resource<List<WorkspaceDto>>> = flow {
        emit(Resource.Loading())
        val result = try {
            val response = api.discoverWorkspaces(query)
            if (response.isSuccessful) {
                Resource.Success(response.body() ?: emptyList())
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            Resource.Error(e.message ?: "An unknown error occurred")
        }
        emit(result)
    }

    suspend fun joinWorkspace(slug: String): Resource<Unit> {
        return try {
            val response = api.joinWorkspace(slug)
            if (response.isSuccessful) {
                // After joining, we might want to refresh workspaces
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    private fun WorkspaceDto.toEntity() = WorkspaceEntity(
        id = id,
        name = name,
        slug = slug,
        icon = icon,
        description = description,
        ownerId = ownerId,
        createdAt = createdAt,
        isPublic = isPublic,
        customDomain = customDomain,
        industry = industry
    )
}
