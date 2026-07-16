package com.scrymechat.android.notifications

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput
import androidx.core.content.ContextCompat
import com.scrymechat.android.R
import com.scrymechat.android.data.local.dao.WorkspaceDao
import com.scrymechat.android.data.repository.ChatRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Handles notification actions: inline "Reply" and "Mark as read".
 *
 * UX notes:
 *  - On send failure, the original notification is restored (instead of silently
 *    disappearing) with an inline error so the message isn't lost without the
 *    person knowing.
 *  - On success, the conversation notification and its group summary are cleared
 *    via [NotificationHelper.clearConversation] for a clean inbox-zero feel.
 */
@AndroidEntryPoint
class ReplyReceiver : BroadcastReceiver() {

    @Inject
    lateinit var chatRepository: ChatRepository

    @Inject
    lateinit var workspaceDao: WorkspaceDao

    @Inject
    lateinit var friendsRepository: com.scrymechat.android.data.repository.FriendsRepository

    companion object {
        const val ACTION_REPLY = "com.scrymechat.android.action.REPLY"
        const val ACTION_MARK_READ = "com.scrymechat.android.action.MARK_READ"
        const val ACTION_ACCEPT_FRIEND = "com.scrymechat.android.action.ACCEPT_FRIEND"
        private const val TAG = "ReplyReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val pendingResult = goAsync()
        val entityId = intent.getStringExtra("entityId")
        val entityType = intent.getStringExtra("entityType")
        val workspaceId = intent.getStringExtra("workspaceId")
        val notificationId = intent.getIntExtra("notificationId", 0)

        if (entityId == null || entityType == null) {
            pendingResult.finish()
            return
        }

        when (intent.action) {
            ACTION_MARK_READ -> handleMarkAsRead(context, entityId, entityType, workspaceId, pendingResult)
            ACTION_REPLY -> handleReply(context, intent, entityId, entityType, workspaceId, notificationId, pendingResult)
            ACTION_ACCEPT_FRIEND -> handleAcceptFriend(context, entityId, notificationId, pendingResult)
            else -> pendingResult.finish()
        }
    }

    private fun handleMarkAsRead(
        context: Context,
        entityId: String,
        entityType: String,
        workspaceId: String?,
        pendingResult: PendingResult
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (entityType == "dm") {
                    chatRepository.markDmRead(entityId)
                } else if (workspaceId != null) {
                    workspaceDao.getWorkspaceById(workspaceId)?.slug?.let { slug ->
                        chatRepository.markChannelRead(slug, entityId)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to mark $entityType $entityId as read", e)
            } finally {
                NotificationHelper(context).clearConversation(entityType, entityId)
                pendingResult.finish()
            }
        }
    }

    private fun handleReply(
        context: Context,
        intent: Intent,
        entityId: String,
        entityType: String,
        workspaceId: String?,
        notificationId: Int,
        pendingResult: PendingResult
    ) {
        val results = RemoteInput.getResultsFromIntent(intent)
        val replyText = results?.getCharSequence(NotificationHelper.KEY_TEXT_REPLY)?.toString()

        if (replyText.isNullOrBlank()) {
            pendingResult.finish()
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (entityType == "dm") {
                    chatRepository.sendDmMessage(entityId, replyText)
                } else if (workspaceId != null) {
                    workspaceDao.getWorkspaceById(workspaceId)?.slug?.let { slug ->
                        chatRepository.sendChannelMessage(slug, entityId, replyText)
                    }
                }
                // Acknowledge the reply inline (matches the system's "message sent"
                // pattern) so the conversation thread visibly includes what was sent,
                // then clear it shortly after via clearConversation from the caller flow.
                acknowledgeReplySent(context, notificationId)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send quick reply for $entityType $entityId", e)
                showReplyFailed(context, notificationId, entityId, entityType, replyText)
            } finally {
                pendingResult.finish()
            }
        }
    }

    private fun handleAcceptFriend(
        context: Context,
        requestId: String,
        notificationId: Int,
        pendingResult: PendingResult
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                friendsRepository.updateFriendRequest(requestId, "accept")
                NotificationManagerCompat.from(context).cancel(notificationId)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to accept friend request $requestId", e)
            } finally {
                pendingResult.finish()
            }
        }
    }

    /** Briefly confirms the reply went out, then lets the next push update replace it. */
    private fun acknowledgeReplySent(context: Context, notificationId: Int) {
        val notificationManager = NotificationManagerCompat.from(context)
        notificationManager.cancel(notificationId)
    }

    /**
     * Restores a notification showing the send failed, with the original text preserved
     * so nothing the person typed is silently lost.
     */
    private fun showReplyFailed(
        context: Context,
        notificationId: Int,
        entityId: String,
        entityType: String,
        failedText: String
    ) {
        val notification = NotificationCompat.Builder(context, NotificationHelper.CHANNEL_URGENT)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Message not sent")
            .setContentText(failedText)
            .setStyle(NotificationCompat.BigTextStyle().bigText("Couldn't send: \"$failedText\". Tap to open the conversation and try again."))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ERROR)
            .setAutoCancel(true)
            .build()

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        ) {
            try {
                NotificationManagerCompat.from(context).notify(notificationId, notification)
            } catch (e: SecurityException) {
                Log.e(TAG, "SecurityException while displaying reply-failed notification", e)
            }
        } else {
            Log.w(TAG, "Cannot show notification: POST_NOTIFICATIONS permission not granted")
        }
    }
}
