package com.scrymechat.android.data.local.dao

import androidx.room.*
import com.scrymechat.android.data.local.entities.WorkspaceMemberEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface WorkspaceMemberDao {
    @Query("SELECT * FROM workspace_members WHERE workspaceId = :workspaceId AND userId = :userId")
    suspend fun getMember(workspaceId: String, userId: String): WorkspaceMemberEntity?

    @Query("SELECT * FROM workspace_members WHERE userId = :userId")
    fun getMembershipsByUserId(userId: String): Flow<List<WorkspaceMemberEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMembers(members: List<WorkspaceMemberEntity>)

    @Query("DELETE FROM workspace_members")
    suspend fun deleteAll()
}
