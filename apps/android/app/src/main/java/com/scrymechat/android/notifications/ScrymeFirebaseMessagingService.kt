package com.scrymechat.android.notifications

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.repository.AuthRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class ScrymeFirebaseMessagingService : FirebaseMessagingService() {

    @Inject
    lateinit var sessionManager: SessionManager

    @Inject
    lateinit var authRepository: AuthRepository

    private val job = SupervisorJob()
    private val scope = CoroutineScope(Dispatchers.IO + job)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Refreshed token: $token")

        // Save token locally
        sessionManager.saveFcmToken(token)

        // If user is logged in, register token with backend
        scope.launch {
            if (sessionManager.isLoggedIn()) {
                try {
                    authRepository.registerDeviceToken(token, "android")
                    Log.d(TAG, "Device token registered successfully")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to register device token", e)
                }
            }
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "From: ${remoteMessage.from}")

        val dataMap = remoteMessage.data.toMutableMap()

        // If the FCM message has a notification payload, merge title and body into data map
        // to guarantee system notification display even when data payload alone is received or mixed.
        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "Message Notification Title: ${notification.title}, Body: ${notification.body}")
            if (!dataMap.containsKey("title") && notification.title != null) {
                dataMap["title"] = notification.title!!
            }
            if (!dataMap.containsKey("body") && notification.body != null) {
                dataMap["body"] = notification.body!!
            }
        }

        if (dataMap.isNotEmpty()) {
            Log.d(TAG, "Displaying notification with payload: $dataMap")
            NotificationHelper(this).showNotification(dataMap)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        job.cancel()
    }

    companion object {
        private const val TAG = "ScrymeFCMService"
    }
}
