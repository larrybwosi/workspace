package com.scrymechat.android.data.repository

import com.scrymechat.android.common.Resource
import com.scrymechat.android.data.local.dao.FriendsDao
import com.scrymechat.android.data.local.dao.UserDao
import com.scrymechat.android.data.local.entities.FriendEntity
import com.scrymechat.android.data.local.entities.FriendRequestEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.remote.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FriendsRepository @Inject constructor(
    private val api: FriendsApi,
    private val friendsDao: FriendsDao,
    private val userDao: UserDao
) {
    fun getFriends(search: String? = null): Flow<Resource<List<FriendEntity>>> = flow {
        emit(Resource.Loading())
        try {
            val response = api.getFriends(search)
            if (response.isSuccessful) {
                val dtos = response.body()?.friends ?: emptyList()
                val entities = dtos.map { it.toEntity() }

                // Also save friend user details
                dtos.forEach { dto ->
                    userDao.insertUser(dto.friend.toEntity())
                }

                friendsDao.insertFriends(entities)
                emit(Resource.Success(entities))
            } else {
                emit(Resource.Error(response.message()))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An unknown error occurred"))
        }
    }

    fun getFriendRequests(type: String? = null, status: String? = null): Flow<Resource<List<FriendRequestEntity>>> = flow {
        emit(Resource.Loading())
        try {
            val response = api.getFriendRequests(type, status)
            if (response.isSuccessful) {
                val dtos = response.body()?.requests ?: emptyList()
                val entities = dtos.map { it.toEntity() }

                // Save sender/receiver user details
                dtos.forEach { dto ->
                    dto.sender?.let { userDao.insertUser(it.toEntity()) }
                    dto.receiver?.let { userDao.insertUser(it.toEntity()) }
                }

                friendsDao.insertFriendRequests(entities)
                emit(Resource.Success(entities))
            } else {
                emit(Resource.Error(response.message()))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "An unknown error occurred"))
        }
    }

    suspend fun sendFriendRequest(receiverId: String, message: String? = null): Resource<FriendRequestEntity> {
        return try {
            val response = api.sendFriendRequest(SendFriendRequestDto(receiverId, message))
            if (response.isSuccessful && response.body() != null) {
                val entity = response.body()!!.toEntity()
                friendsDao.insertFriendRequests(listOf(entity))
                Resource.Success(entity)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun updateFriendRequest(requestId: String, action: String): Resource<FriendRequestDto> {
        return try {
            val response = api.updateFriendRequest(requestId, UpdateFriendRequestDto(action))
            if (response.isSuccessful && response.body() != null) {
                if (action == "accept") {
                    // Refresh friends after accepting
                    getFriends().collect {}
                }
                friendsDao.deleteFriendRequestById(requestId)
                Resource.Success(response.body()!!)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    suspend fun deleteFriend(friendshipId: String): Resource<Unit> {
        return try {
            val response = api.deleteFriendRequest(friendshipId)
            if (response.isSuccessful) {
                friendsDao.deleteFriendById(friendshipId)
                friendsDao.deleteFriendRequestById(friendshipId)
                Resource.Success(Unit)
            } else {
                Resource.Error(response.message())
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "An unknown error occurred")
        }
    }

    private fun FriendDto.toEntity() = FriendEntity(
        id = id,
        userId = userId,
        friendId = friendId,
        createdAt = createdAt
    )

    private fun FriendRequestDto.toEntity() = FriendRequestEntity(
        id = id,
        senderId = senderId,
        receiverId = receiverId,
        status = status,
        message = message,
        createdAt = createdAt
    )

    private fun UserDto.toEntity() = UserEntity(
        id = id,
        name = name,
        username = username,
        email = email,
        avatar = avatar,
        banner = banner,
        statusText = statusText,
        statusEmoji = statusEmoji,
        role = role ?: "user",
        status = status ?: "offline"
    )
}
