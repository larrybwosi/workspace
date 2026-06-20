package com.scrymechat.android.data.local.dao

import androidx.room.*
import com.scrymechat.android.data.local.entities.MessageEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE channelId = :channelId ORDER BY createdAt DESC")
    fun getMessagesForChannelFlow(channelId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE dmId = :dmId ORDER BY createdAt DESC")
    fun getMessagesForDmFlow(dmId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE id = :id")
    suspend fun getMessageById(id: String): MessageEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<MessageEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Query("DELETE FROM messages WHERE id = :id")
    suspend fun deleteMessageById(id: String)

    @Query("DELETE FROM messages WHERE channelId = :channelId")
    suspend fun deleteMessagesForChannel(channelId: String)

    @Query("DELETE FROM messages WHERE dmId = :dmId")
    suspend fun deleteMessagesForDm(dmId: String)

    @Query("UPDATE messages SET readByCurrentUser = 1 WHERE channelId = :channelId")
    suspend fun markChannelMessagesAsRead(channelId: String)

    @Query("UPDATE messages SET readByCurrentUser = 1 WHERE dmId = :dmId")
    suspend fun markDmMessagesAsRead(dmId: String)

    @Query("DELETE FROM messages")
    suspend fun deleteAll()
}
