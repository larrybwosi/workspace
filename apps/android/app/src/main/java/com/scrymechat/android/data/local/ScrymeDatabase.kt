package com.scrymechat.android.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.scrymechat.android.data.local.dao.SessionDao
import com.scrymechat.android.data.local.dao.UserDao
import com.scrymechat.android.data.local.dao.WorkspaceMemberDao
import com.scrymechat.android.data.local.entities.SessionEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceMemberEntity

@Database(
    entities = [
        UserEntity::class,
        WorkspaceMemberEntity::class,
        SessionEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class ScrymeDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun workspaceMemberDao(): WorkspaceMemberDao
    abstract fun sessionDao(): SessionDao
}
