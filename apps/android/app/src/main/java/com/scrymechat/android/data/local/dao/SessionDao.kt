package com.scrymechat.android.data.local.dao

import androidx.room.*
import com.scrymechat.android.data.local.entities.SessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SessionDao {
    @Query("SELECT * FROM sessions LIMIT 1")
    suspend fun getActiveSession(): SessionEntity?

    @Query("SELECT * FROM sessions LIMIT 1")
    fun getActiveSessionFlow(): Flow<SessionEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: SessionEntity)

    @Query("UPDATE sessions SET activeWorkspaceId = :workspaceId")
    suspend fun updateActiveWorkspace(workspaceId: String?)

    @Query("DELETE FROM sessions")
    suspend fun clear()
}
