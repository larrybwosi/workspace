package com.scrymechat.android.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import androidx.core.app.Person
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.IconCompat
import com.scrymechat.android.MainActivity
import com.scrymechat.android.R
import java.util.concurrent.ConcurrentHashMap

/**
 * Builds and posts notifications for ScryMeChat.
 *
 * Enterprise-style conventions applied here:
 *  - Conversations render with [NotificationCompat.MessagingStyle] so multi-message
 *    threads look like a real chat (Slack/Teams-style) instead of stacked one-liners.
 *  - Notifications are grouped per-conversation with a summary, so the shade doesn't
 *    flood with individual entries.
 *  - Every conversation notification offers both "Reply" and "Mark as read" so people
 *    can clear a thread without opening the app.
 *  - PendingIntent request codes are namespaced per action so they never collide.
 */
class NotificationHelper(private val context: Context) {

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    companion object {
        const val CHANNEL_URGENT = "urgent"
        const val CHANNEL_HIGH = "high"
        const val CHANNEL_NORMAL = "normal"
        const val KEY_TEXT_REPLY = "key_text_reply"

        const val GROUP_DM = "group_dm"
        const val GROUP_CHANNEL = "group_channel"
        const val GROUP_SYSTEM = "group_system"

        private const val SUMMARY_ID_DM = -100
        private const val SUMMARY_ID_CHANNEL = -101

        // Request-code namespaces so content/reply/read PendingIntents never collide,
        // even when they share the same notificationId.
        private const val REQ_CONTENT = 1
        private const val REQ_REPLY = 2
        private const val REQ_MARK_READ = 3

        // Tracks message history per conversation so MessagingStyle can render a thread
        // rather than a single line. Keyed by "entityType:entityId".
        private val conversationHistory = ConcurrentHashMap<String, MutableList<MessagingMessage>>()

        private fun conversationKey(entityType: String, entityId: String) = "$entityType:$entityId"
    }

    private data class MessagingMessage(
        val text: String,
        val timestamp: Long,
        val senderName: String
    )

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val urgentChannel = NotificationChannel(
                CHANNEL_URGENT,
                "Direct messages & mentions",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Direct messages and @mentions that need your attention"
                enableLights(true)
                lightColor = Color.parseColor("#8B5CF6")
            }

            val highChannel = NotificationChannel(
                CHANNEL_HIGH,
                "Channel activity",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "New messages in channels you've joined"
            }

            val normalChannel = NotificationChannel(
                CHANNEL_NORMAL,
                "Workspace updates",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "System and workspace notifications"
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
        val entityType = data["entityType"] ?: if (type == "direct_message") "dm" else "channel"
        val senderAvatarUrl = data["senderAvatarUrl"]

        val channelId = when (type) {
            "direct_message", "mention", "friend_request" -> CHANNEL_URGENT
            "channel_alert" -> CHANNEL_HIGH
            else -> CHANNEL_NORMAL
        }

        // Conversation notifications (DM/channel) get a stable ID per-conversation so
        // new messages update the same thread instead of stacking duplicate entries.
        // System notifications keep a unique, timestamp-based ID.
        if (type == "friend_request") {
            showFriendRequestNotification(entityId, title, body)
            return
        }

        val isConversation = entityId.isNotEmpty() && (type == "direct_message" || type == "mention" || type == "channel_alert")
        val notificationId = if (isConversation) {
            conversationKey(entityType, entityId).hashCode()
        } else {
            System.currentTimeMillis().toInt()
        }

        if (!isConversation) {
            showSystemNotification(notificationId, channelId, title, body)
            return
        }

        val key = conversationKey(entityType, entityId)
        val history = conversationHistory.getOrPut(key) { mutableListOf() }
        history.add(MessagingMessage(body, System.currentTimeMillis(), title))
        // Cap history so memory doesn't grow unbounded for very active threads.
        if (history.size > 10) history.removeAt(0)

        val person = Person.Builder()
            .setName(title)
            .setIcon(senderAvatarUrl?.let { loadAvatarIcon(it) })
            .build()

        val messagingStyle = NotificationCompat.MessagingStyle(
            Person.Builder().setName("You").build()
        )
        messagingStyle.conversationTitle = if (entityType == "channel") title else null
        messagingStyle.isGroupConversation = entityType == "channel"
        history.forEach { msg ->
            messagingStyle.addMessage(msg.text, msg.timestamp, person)
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .apply {
                try {
                    setColor(ContextCompat.getColor(context, R.color.brand_primary))
                } catch (e: Exception) {
                    // Fallback for tests or missing resource
                }
            }
            .setStyle(messagingStyle)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setAutoCancel(true)
            .setShowWhen(true)
            .setGroup(if (entityType == "dm") GROUP_DM else GROUP_CHANNEL)
            .setContentIntent(buildContentIntent(notificationId, type, entityId, entityType))
            .addAction(buildReplyAction(context, notificationId, entityId, entityType, person.name.toString()))
            .addAction(buildMarkAsReadAction(notificationId, entityId, entityType))
            .build()

        notificationManager.notify(notificationId, notification)
        postGroupSummary(entityType, channelId)
    }

    private fun showFriendRequestNotification(requestId: String, title: String, body: String) {
        val notificationId = requestId.hashCode()
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("type", "friend_request")
            putExtra("entityId", requestId)
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val acceptIntent = Intent(context, ReplyReceiver::class.java).apply {
            action = ReplyReceiver.ACTION_ACCEPT_FRIEND
            putExtra("entityId", requestId)
            putExtra("notificationId", notificationId)
        }
        val acceptPendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId * 10 + 4, // Unique request code for accept
            acceptIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_URGENT)
            .setSmallIcon(R.drawable.ic_notification)
            .apply {
                try {
                    setColor(ContextCompat.getColor(context, R.color.brand_primary))
                } catch (e: Exception) {}
            }
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_SOCIAL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .addAction(R.drawable.ic_check, "Accept", acceptPendingIntent)
            .build()

        notificationManager.notify(notificationId, notification)
    }

    private fun showSystemNotification(notificationId: Int, channelId: String, title: String, body: String) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .apply {
                try {
                    setColor(ContextCompat.getColor(context, R.color.brand_primary))
                } catch (e: Exception) {
                    // Fallback
                }
            }
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setAutoCancel(true)
            .setGroup(GROUP_SYSTEM)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(notificationId, notification)
    }

    /** Bundles individual conversation notifications under a single summary entry per type. */
    private fun postGroupSummary(entityType: String, channelId: String) {
        val (groupKey, summaryId, summaryTitle) = if (entityType == "dm") {
            Triple(GROUP_DM, SUMMARY_ID_DM, "Direct messages")
        } else {
            Triple(GROUP_CHANNEL, SUMMARY_ID_CHANNEL, "Channel activity")
        }

        val summary = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .apply {
                try {
                    setColor(ContextCompat.getColor(context, R.color.brand_primary))
                } catch (e: Exception) {
                    // Fallback
                }
            }
            .setContentTitle(summaryTitle)
            .setStyle(NotificationCompat.InboxStyle().setSummaryText(summaryTitle))
            .setGroup(groupKey)
            .setGroupSummary(true)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(summaryId, summary)
    }

    private fun buildContentIntent(
        notificationId: Int,
        type: String,
        entityId: String,
        entityType: String
    ): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("type", type)
            putExtra("entityId", entityId)
            putExtra("entityType", entityType)
        }
        return PendingIntent.getActivity(
            context,
            notificationId * 10 + REQ_CONTENT,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    private fun buildReplyAction(
        context: Context,
        notificationId: Int,
        entityId: String,
        entityType: String,
        senderName: String
    ): NotificationCompat.Action {
        val remoteInput = RemoteInput.Builder(KEY_TEXT_REPLY)
            .setLabel("Message $senderName")
            .build()

        val replyIntent = Intent(context, ReplyReceiver::class.java).apply {
            action = ReplyReceiver.ACTION_REPLY
            putExtra("entityId", entityId)
            putExtra("entityType", entityType)
            putExtra("notificationId", notificationId)
        }

        val replyPendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId * 10 + REQ_REPLY,
            replyIntent,
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Action.Builder(
            R.drawable.ic_reply,
            "Reply",
            replyPendingIntent
        )
            .addRemoteInput(remoteInput)
            .setAllowGeneratedReplies(true)
            .setSemanticAction(NotificationCompat.Action.SEMANTIC_ACTION_REPLY)
            .build()
    }

    private fun buildMarkAsReadAction(
        notificationId: Int,
        entityId: String,
        entityType: String
    ): NotificationCompat.Action {
        val readIntent = Intent(context, ReplyReceiver::class.java).apply {
            action = ReplyReceiver.ACTION_MARK_READ
            putExtra("entityId", entityId)
            putExtra("entityType", entityType)
            putExtra("notificationId", notificationId)
        }

        val readPendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId * 10 + REQ_MARK_READ,
            readIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Action.Builder(
            R.drawable.ic_check,
            "Mark as read",
            readPendingIntent
        )
            .setSemanticAction(NotificationCompat.Action.SEMANTIC_ACTION_MARK_AS_READ)
            .setShowsUserInterface(false)
            .build()
    }

    private fun loadAvatarIcon(url: String): IconCompat? {
        // Hook up to your existing image-loading pipeline (e.g. Coil/Glide) to fetch
        // and cache a circular bitmap for the sender. Returning null falls back to
        // the system's default person glyph, which still looks correct in MessagingStyle.
        return null
    }

    /** Called by ReplyReceiver once a reply finishes, to clear or restore conversation state. */
    fun clearConversation(entityType: String, entityId: String) {
        conversationHistory.remove(conversationKey(entityType, entityId))
        NotificationManagerCompat.from(context).cancel(conversationKey(entityType, entityId).hashCode())
    }
}
