package com.scrymechat.android.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.scrymechat.android.data.local.converters.DatabaseConverters
import com.scrymechat.android.data.local.dao.SessionDao
import com.scrymechat.android.data.local.dao.UserDao
import com.scrymechat.android.data.local.dao.WorkspaceMemberDao
import com.scrymechat.android.data.local.entities.SessionEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceMemberEntity

import com.scrymechat.android.data.local.dao.*
import com.scrymechat.android.data.local.entities.*

@Database(
    entities = [
        UserEntity::class,
        WorkspaceMemberEntity::class,
        SessionEntity::class,
        WorkspaceEntity::class,
        ChannelEntity::class,
        DmConversationEntity::class,
        MessageEntity::class,
        FriendEntity::class,
        FriendRequestEntity::class
    ],
    version = 4,
    exportSchema = false
)
@TypeConverters(DatabaseConverters::class)
abstract class ScrymeDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun workspaceMemberDao(): WorkspaceMemberDao
    abstract fun sessionDao(): SessionDao
    abstract fun workspaceDao(): WorkspaceDao
    abstract fun channelDao(): ChannelDao
    abstract fun dmDao(): DmDao
    abstract fun messageDao(): MessageDao
    abstract fun friendsDao(): FriendsDao
}
