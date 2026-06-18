package com.scrymechat.android.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.scrymechat.android.MainActivity
import com.scrymechat.android.R

class NotificationHelper(private val context: Context) {

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    companion object {
        const val CHANNEL_URGENT = "urgent"
        const val CHANNEL_HIGH = "high"
        const val CHANNEL_NORMAL = "normal"
        const val KEY_TEXT_REPLY = "key_text_reply"
    }

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val urgentChannel = NotificationChannel(
                CHANNEL_URGENT,
                "Urgent Notifications (DMs/Mentions)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Used for direct messages and mentions"
            }

            val highChannel = NotificationChannel(
                CHANNEL_HIGH,
                "High Priority (Channels)",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Used for channel messages"
            }

            val normalChannel = NotificationChannel(
                CHANNEL_NORMAL,
                "Normal Priority",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Used for other updates"
            }

            notificationManager.createNotificationChannels(
                listOf(urgentChannel, highChannel, normalChannel)
            )
        }
    }

    fun showNotification(data: Map<String, String>) {
        val title = data["title"] ?: "New Message"
        val body = data["body"] ?: ""
        val type = data["type"] ?: "system"
        val entityId = data["entityId"] ?: ""
        val entityType = data["entityType"] ?: ""
        val notificationId = System.currentTimeMillis().toInt()

        val channelId = when (type) {
            "direct_message", "mention" -> CHANNEL_URGENT
            "channel_alert" -> CHANNEL_HIGH
            else -> CHANNEL_NORMAL
        }

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("type", type)
            putExtra("entityId", entityId)
            putExtra("entityType", entityType)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Quick Reply Action
        val remoteInput = androidx.core.app.RemoteInput.Builder(KEY_TEXT_REPLY)
            .setLabel("Reply...")
            .build()

        val replyIntent = Intent(context, ReplyReceiver::class.java).apply {
            putExtra("entityId", entityId)
            putExtra("entityType", if (type == "direct_message") "dm" else "channel")
            putExtra("notificationId", notificationId)
        }

        val replyPendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId,
            replyIntent,
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val replyAction = NotificationCompat.Action.Builder(
            R.mipmap.ic_launcher,
            "Reply",
            replyPendingIntent
        ).addRemoteInput(remoteInput).build()

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .addAction(replyAction)
            .build()

        notificationManager.notify(notificationId, notification)
    }
}
