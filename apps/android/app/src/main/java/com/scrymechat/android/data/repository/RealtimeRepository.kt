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

    fun observeMessages(): Flow<RealtimeMessageEvent> = callbackFlow {
        val createListener = Emitter.Listener { args ->
            try {
                val data = args[0].toString()
                val message = gson.fromJson(data, MessageDto::class.java)
                trySend(RealtimeMessageEvent("sent", message))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        val updateListener = Emitter.Listener { args ->
            try {
                val data = args[0].toString()
                val message = gson.fromJson(data, MessageDto::class.java)
                trySend(RealtimeMessageEvent("updated", message))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        val deleteListener = Emitter.Listener { args ->
            try {
                val data = args[0].toString()
                val message = gson.fromJson(data, MessageDto::class.java)
                trySend(RealtimeMessageEvent("deleted", message))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        socket.on("message:new", createListener)
        socket.on("message:sent", createListener)
        socket.on("message:update", updateListener)
        socket.on("message:updated", updateListener)
        socket.on("message:delete", deleteListener)
        socket.on("message:deleted", deleteListener)

        awaitClose {
            socket.off("message:new", createListener)
            socket.off("message:sent", createListener)
            socket.off("message:update", updateListener)
            socket.off("message:updated", updateListener)
            socket.off("message:delete", deleteListener)
            socket.off("message:deleted", deleteListener)
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
            try {
                val data = args[0].toString()
                val notification = gson.fromJson(data, NotificationDto::class.java)
                trySend(notification)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        val events = arrayOf("notification:new", "notification", "NOTIFICATION")
        events.forEach { socket.on(it, listener) }
        awaitClose {
            events.forEach { socket.off(it, listener) }
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

data class RealtimeMessageEvent(
    val eventType: String,
    val message: MessageDto
)

data class TypingEvent(
    val userId: String,
    val userName: String,
    val room: String
)

data class PresenceEvent(
    val userId: String,
    val isOnline: Boolean
)
