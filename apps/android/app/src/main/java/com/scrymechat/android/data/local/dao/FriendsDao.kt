package com.scrymechat.android.data.local.dao

import androidx.room.*
import com.scrymechat.android.data.local.entities.FriendEntity
import com.scrymechat.android.data.local.entities.FriendRequestEntity
import com.scrymechat.android.data.local.entities.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface FriendsDao {
    @Query("SELECT * FROM friends")
    fun getAllFriendsFlow(): Flow<List<FriendEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFriends(friends: List<FriendEntity>)

    @Query("DELETE FROM friends WHERE id = :friendshipId")
    suspend fun deleteFriendById(friendshipId: String)

    @Query("SELECT * FROM friend_requests")
    fun getAllFriendRequestsFlow(): Flow<List<FriendRequestEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFriendRequests(requests: List<FriendRequestEntity>)

    @Query("DELETE FROM friend_requests WHERE id = :requestId")
    suspend fun deleteFriendRequestById(requestId: String)

    @Transaction
    @Query("""
        SELECT users.* FROM users
        JOIN friends ON users.id = friends.friendId
        OR users.id = friends.userId
        WHERE (friends.userId = :currentUserId AND users.id != :currentUserId)
        OR (friends.friendId = :currentUserId AND users.id != :currentUserId)
    """)
    fun getFriendsWithUserDetails(currentUserId: String): Flow<List<UserEntity>>
}
