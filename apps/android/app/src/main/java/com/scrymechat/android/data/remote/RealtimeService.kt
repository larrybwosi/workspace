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
import javax.inject.Provider

@AndroidEntryPoint
class RealtimeService : LifecycleService() {

    @Inject
    lateinit var socket: Socket

    @Inject
    lateinit var sessionManager: SessionManager

    override fun onCreate() {
        super.onCreate()
        Log.d("RealtimeService", "RealtimeService created")
        connectSocket()
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

            // Dynamically assign authorization token to socket options via reflection as opts is private in Manager
            try {
                val manager = socket.io()
                val optsField = manager.javaClass.getDeclaredField("opts")
                optsField.isAccessible = true
                val opts = optsField.get(manager) as io.socket.client.IO.Options
                opts.auth = mapOf("token" to token)
            } catch (e: Exception) {
                Log.e("RealtimeService", "Failed to dynamically set auth options on Socket.io", e)
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
