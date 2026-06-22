package com.scrymechat.android.data.remote

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import com.scrymechat.android.data.local.SessionManager
import dagger.hilt.android.AndroidEntryPoint
import io.socket.client.Socket
import javax.inject.Inject

@AndroidEntryPoint
class RealtimeService : LifecycleService() {

    @Inject
    lateinit var socket: Socket

    @Inject
    lateinit var sessionManager: SessionManager

    override fun onCreate() {
        super.onCreate()
        Log.d("RealtimeService", "RealtimeService created")
        startForegroundService()
        connectSocket()
    }

    private fun startForegroundService() {
        val channelId = "realtime_service_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Realtime Connection",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Scrymechat")
            .setContentText("Connected to realtime services")
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            // Foreground service types like 'specialUse' are only required on Android 14 (API 34) and above.
            // For older versions (including Android 10), we fall back to the standard startForeground call.
            startForeground(1, notification)
        }
    }

    private fun connectSocket() {
        val token = sessionManager.getToken()
        if (token != null) {
            socket.io().on(io.socket.engineio.client.Socket.EVENT_UPGRADE) {
                Log.d("RealtimeService", "Socket upgraded")
            }
            socket.io().on(io.socket.engineio.client.Socket.EVENT_OPEN) {
                Log.d("RealtimeService", "Socket transport opened")
            }

            socket.connect()
            Log.d("RealtimeService", "Socket connecting...")
        } else {
            Log.d("RealtimeService", "No token found, socket not connecting")
            stopSelf()
        }
    }

    override fun onDestroy() {
        socket.disconnect()
        Log.d("RealtimeService", "RealtimeService destroyed, socket disconnected")
        super.onDestroy()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        return START_STICKY
    }
}
