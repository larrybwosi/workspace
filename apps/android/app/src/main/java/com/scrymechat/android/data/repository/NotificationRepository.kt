package com.scrymechat.android.data.repository

import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.dao.NotificationDao
import com.scrymechat.android.data.local.entities.NotificationEntity
import com.scrymechat.android.data.remote.NotificationApi
import com.scrymechat.android.data.remote.NotificationDto
import com.scrymechat.android.data.remote.UpdateNotificationRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepository @Inject constructor(
    private val api: NotificationApi,
    private val dao: NotificationDao
) {
    fun getNotificationsFlow(): Flow<List<NotificationEntity>> = dao.getNotificationsFlow()

    suspend fun fetchNotifications(unreadOnly: Boolean? = null, limit: Int? = null): Resource<List<NotificationEntity>> {
        return try {
            val response = api.getNotifications(unreadOnly, limit)
            if (response.isSuccessful && response.body() != null) {
                val entities = response.body()!!.map { it.toEntity() }
                dao.insertNotifications(entities)
                Resource.Success(entities)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun markAsRead(id: String): Resource<Unit> {
        return try {
            val response = api.updateNotification(id, UpdateNotificationRequest(isRead = true))
            if (response.isSuccessful) {
                dao.updateReadStatus(id, true)
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun markAllRead(userId: String): Resource<Unit> {
        return try {
            val response = api.markAllRead()
            if (response.isSuccessful) {
                dao.markAllAsRead(userId)
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    private fun NotificationDto.toEntity() = NotificationEntity(
        id = id,
        userId = userId,
        type = type,
        title = title,
        message = message,
        entityType = entityType,
        entityId = entityId,
        linkUrl = linkUrl,
        isRead = isRead,
        metadata = metadata,
        createdAt = createdAt
    )
}
