package com.scrymechat.android.di

import android.content.Context
import androidx.room.Room
import com.scrymechat.android.data.local.ScrymeDatabase
import com.scrymechat.android.data.local.dao.*
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
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun provideUserDao(database: ScrymeDatabase): UserDao = database.userDao()

    @Provides
    fun provideWorkspaceMemberDao(database: ScrymeDatabase): WorkspaceMemberDao = database.workspaceMemberDao()

    @Provides
    fun provideSessionDao(database: ScrymeDatabase): SessionDao = database.sessionDao()

    @Provides
    fun provideWorkspaceDao(database: ScrymeDatabase): WorkspaceDao = database.workspaceDao()

    @Provides
    fun provideChannelDao(database: ScrymeDatabase): ChannelDao = database.channelDao()

    @Provides
    fun provideDmDao(database: ScrymeDatabase): DmDao = database.dmDao()

    @Provides
    fun provideMessageDao(database: ScrymeDatabase): MessageDao = database.messageDao()
}
