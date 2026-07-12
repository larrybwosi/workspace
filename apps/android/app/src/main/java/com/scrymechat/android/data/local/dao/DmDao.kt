package com.scrymechat.android.data.local.dao

import androidx.room.*
import com.scrymechat.android.data.local.entities.DmConversationEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DmDao {
    @Query("SELECT * FROM dm_conversations ORDER BY lastMessageAt DESC")
    fun getAllDmsFlow(): Flow<List<DmConversationEntity>>

    @Query("SELECT * FROM dm_conversations WHERE id = :id")
    suspend fun getDmById(id: String): DmConversationEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDms(dms: List<DmConversationEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDm(dm: DmConversationEntity)

    @Query("UPDATE dm_conversations SET unreadCount = 0 WHERE id = :id")
    suspend fun clearUnreadCount(id: String)

    @Query("DELETE FROM dm_conversations WHERE id = :id")
    suspend fun deleteDmById(id: String)

    @Query("DELETE FROM dm_conversations")
    suspend fun deleteAll()

    @Transaction
    @Query("""
        SELECT dm_conversations.*, users.name as otherUserName, users.avatar as otherUserAvatar, users.status as otherUserStatus, users.statusText as otherUserStatusText, users.statusEmoji as otherUserStatusEmoji
        FROM dm_conversations
        JOIN users ON dm_conversations.otherUserId = users.id
        ORDER BY lastMessageAt DESC
    """)
    fun getDmsWithUserInfoFlow(): Flow<List<DmWithUser>>
}

data class DmWithUser(
    @Embedded val dm: DmConversationEntity,
    val otherUserName: String?,
    val otherUserAvatar: String?,
    val otherUserStatus: String? = null,
    val otherUserStatusText: String? = null,
    val otherUserStatusEmoji: String? = null
)
