package com.scrymechat.android.di

import com.scrymechat.android.data.local.dao.*
import com.scrymechat.android.data.remote.*
import com.scrymechat.android.data.repository.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideWorkspaceRepository(
        api: WorkspaceApi,
        dao: WorkspaceDao
    ): WorkspaceRepository = WorkspaceRepository(api, dao)

    @Provides
    @Singleton
    fun provideChannelRepository(
        api: ChannelApi,
        dao: ChannelDao
    ): ChannelRepository = ChannelRepository(api, dao)

    @Provides
    @Singleton
    fun provideDmRepository(
        api: DmApi,
        dao: DmDao,
        userDao: UserDao
    ): DmRepository = DmRepository(api, dao, userDao)

    @Provides
    @Singleton
    fun provideChatRepository(
        api: MessageApi,
        dao: MessageDao
    ): ChatRepository = ChatRepository(api, dao)

    @Provides
    @Singleton
    fun provideFriendsRepository(
        api: FriendsApi,
        friendsDao: FriendsDao,
        userDao: UserDao
    ): FriendsRepository = FriendsRepository(api, friendsDao, userDao)

    @Provides
    @Singleton
    fun provideInvitationsRepository(
        api: InvitationsApi
    ): InvitationsRepository = InvitationsRepository(api)
}
