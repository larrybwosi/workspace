package com.scrymechat.android.data.repository

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import com.scrymechat.android.data.remote.StorageApi
import com.scrymechat.android.data.remote.UploadResponse
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StorageRepository @Inject constructor(
    private val storageApi: StorageApi,
    @ApplicationContext private val context: Context
) {

    suspend fun uploadFile(file: File): Result<UploadResponse> {
        return try {
            val requestFile = file.asRequestBody("application/octet-stream".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)

            val response = storageApi.uploadFile(body)
            if (response.isSuccessful) {
                val bodyResponse = response.body()
                if (bodyResponse != null) {
                    Result.success(bodyResponse)
                } else {
                    Result.failure(Exception("Empty upload response"))
                }
            } else {
                Result.failure(Exception("Upload failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun downloadFile(url: String, fileName: String, mimeType: String? = null): Long {
        val isImage = mimeType?.startsWith("image/") == true
        val directory = if (isImage) Environment.DIRECTORY_PICTURES else Environment.DIRECTORY_DOWNLOADS
        val subPath = "ScrymeChat/$fileName"

        val request = DownloadManager.Request(Uri.parse(url))
            .setTitle(fileName)
            .setDescription("Downloading file from Scrymechat")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalPublicDir(directory, subPath)
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(true)
            .apply {
                if (mimeType != null) {
                    setMimeType(mimeType)
                }
            }

        // Make the file scanable by MediaScanner
        request.allowScanningByMediaScanner()

        val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        return downloadManager.enqueue(request)
    }
}
