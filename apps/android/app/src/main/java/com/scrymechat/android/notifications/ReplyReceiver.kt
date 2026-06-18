package com.scrymechat.android.notifications

import android.app.RemoteInput
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import com.scrymechat.android.data.repository.ChatRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class ReplyReceiver : BroadcastReceiver() {

    @Inject
    lateinit var chatRepository: ChatRepository

    override fun onReceive(context: Context, intent: Intent) {
        val pendingResult = goAsync()
        val remoteInput = RemoteInput.getResultsFromIntent(intent)
        if (remoteInput != null) {
            val replyText = remoteInput.getCharSequence(NotificationHelper.KEY_TEXT_REPLY)?.toString()
            val entityId = intent.getStringExtra("entityId")
            val entityType = intent.getStringExtra("entityType")
            val notificationId = intent.getIntExtra("notificationId", 0)

            if (replyText != null && entityId != null) {
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        if (entityType == "dm") {
                            chatRepository.sendDmMessage(entityId, replyText)
                        } else if (entityType == "channel") {
                            chatRepository.sendChannelMessage(entityId, replyText)
                        }

                        // Update notification to show "Sent" or just cancel it
                        val notificationManager = NotificationManagerCompat.from(context)
                        notificationManager.cancel(notificationId)
                    } catch (e: Exception) {
                        Log.e("ReplyReceiver", "Failed to send quick reply", e)
                    } finally {
                        pendingResult.finish()
                    }
                }
            } else {
                pendingResult.finish()
            }
        } else {
            pendingResult.finish()
        }
    }
}
