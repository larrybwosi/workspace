package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.*

interface NotificationApi {
    @GET("notifications")
    suspend fun getNotifications(
        @Query("unreadOnly") unreadOnly: Boolean? = null,
        @Query("limit") limit: Int? = null
    ): Response<List<NotificationDto>>

    @POST("notifications/mark-all-read")
    suspend fun markAllRead(): Response<Unit>

    @PATCH("notifications/{id}")
    suspend fun updateNotification(
        @Path("id") id: String,
        @Body request: UpdateNotificationRequest
    ): Response<NotificationDto>

    @DELETE("notifications/{id}")
    suspend fun deleteNotification(
        @Path("id") id: String
    ): Response<Unit>
}
