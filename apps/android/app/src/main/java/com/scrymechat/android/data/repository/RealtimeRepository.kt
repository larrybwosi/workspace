package com.scrymechat.android.data.repository

import com.google.gson.Gson
import com.scrymechat.android.data.remote.MessageDto
import com.scrymechat.android.data.remote.NotificationDto
import com.scrymechat.android.data.remote.PresenceDto
import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONObject
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RealtimeRepository @Inject constructor(
    private val socket: Socket,
    private val gson: Gson
) {

    fun observeMessages(): Flow<MessageDto> = callbackFlow {
        val listener = Emitter.Listener { args ->
            val data = args[0].toString()
            val message = gson.fromJson(data, MessageDto::class.java)
            trySend(message)
        }
        socket.on("message:new", listener)
        socket.on("message:update", listener)
        awaitClose {
            socket.off("message:new", listener)
            socket.off("message:update", listener)
        }
    }

    fun observePresence(): Flow<PresenceEvent> = callbackFlow {
        val enterListener = Emitter.Listener { args ->
            try {
                val data = args[0].toString()
                val dto = gson.fromJson(data, PresenceDto::class.java)
                trySend(PresenceEvent(userId = dto.userId, isOnline = true))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        val leaveListener = Emitter.Listener { args ->
            try {
                val data = args[0].toString()
                val dto = gson.fromJson(data, PresenceDto::class.java)
                trySend(PresenceEvent(userId = dto.userId, isOnline = false))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        socket.on("presence:enter", enterListener)
        socket.on("presence:leave", leaveListener)
        awaitClose {
            socket.off("presence:enter", enterListener)
            socket.off("presence:leave", leaveListener)
        }
    }

    fun observeNotifications(): Flow<NotificationDto> = callbackFlow {
        val listener = Emitter.Listener { args ->
            val data = args[0].toString()
            val notification = gson.fromJson(data, NotificationDto::class.java)
            trySend(notification)
        }
        socket.on("notification:new", listener)
        awaitClose {
            socket.off("notification:new", listener)
        }
    }

    fun observeTyping(): Flow<TypingEvent> = callbackFlow {
        val listener = Emitter.Listener { args ->
            try {
                val data = args[0].toString()
                val event = gson.fromJson(data, TypingEvent::class.java)
                trySend(event)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        socket.on("typing", listener)
        awaitClose {
            socket.off("typing", listener)
        }
    }

    fun sendTyping(room: String, userId: String, userName: String) {
        val payload = JSONObject().apply {
            put("room", room)
            put("userId", userId)
            put("userName", userName)
        }
        socket.emit("typing", payload)
    }

    fun joinRoom(room: String) {
        socket.emit("join-room", room)
    }

    fun leaveRoom(room: String) {
        socket.emit("leave-room", room)
    }

    fun enterPresence(channel: String, userId: String, data: Map<String, Any>? = null) {
        val payload = JSONObject().apply {
            put("channel", channel)
            put("userId", userId)
            data?.let { put("data", JSONObject(it)) }
        }
        socket.emit("enter-presence", payload)
    }

    fun leavePresence(channel: String, userId: String) {
        val payload = JSONObject().apply {
            put("channel", channel)
            put("userId", userId)
        }
        socket.emit("leave-presence", payload)
    }
}

data class TypingEvent(
    val userId: String,
    val userName: String,
    val room: String
)

data class PresenceEvent(
    val userId: String,
    val isOnline: Boolean
)
