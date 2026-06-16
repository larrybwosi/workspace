package com.scrymechat.android.data.remote

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface StorageApi {
    @Multipart
    @POST("storage/upload")
    suspend fun uploadFile(
        @Part file: MultipartBody.Part
    ): Response<UploadResponse>
}

data class UploadResponse(
    val id: String,
    val url: String,
    val name: String,
    val type: String,
    val size: Long
)
