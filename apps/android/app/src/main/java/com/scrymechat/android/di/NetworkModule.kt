package com.scrymechat.android.di

import com.google.gson.Gson
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.remote.AuthApi
import com.scrymechat.android.data.remote.StorageApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.socket.client.IO
import io.socket.client.Socket
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.net.URI
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideGson(): Gson = Gson()

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl("http://10.0.2.2:3000/api/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: Retrofit): AuthApi {
        return retrofit.create(AuthApi::class.java)
    }

    @Provides
    @Singleton
    fun provideStorageApi(retrofit: Retrofit): StorageApi {
        return retrofit.create(StorageApi::class.java)
    }

    @Provides
    @Singleton
    fun provideSocket(sessionManager: SessionManager): Socket {
        val options = IO.Options.builder()
            .setAuth(mapOf("token" to sessionManager.getToken()))
            .build()
        // Use 10.0.2.2 for Android Emulator to reach localhost
        return IO.socket(URI.create("http://10.0.2.2:3000"), options)
    }
}
