package com.scrymechat.android.di

import android.content.Context
import androidx.room.Room
import com.scrymechat.android.data.local.ScrymeDatabase
import com.scrymechat.android.data.local.dao.SessionDao
import com.scrymechat.android.data.local.dao.UserDao
import com.scrymechat.android.data.local.dao.WorkspaceMemberDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): ScrymeDatabase {
        return Room.databaseBuilder(
            context,
            ScrymeDatabase::class.java,
            "scryme_db"
        ).build()
    }

    @Provides
    fun provideUserDao(database: ScrymeDatabase): UserDao = database.userDao()

    @Provides
    fun provideWorkspaceMemberDao(database: ScrymeDatabase): WorkspaceMemberDao = database.workspaceMemberDao()

    @Provides
    fun provideSessionDao(database: ScrymeDatabase): SessionDao = database.sessionDao()
}
