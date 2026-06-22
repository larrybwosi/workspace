package com.scrymechat.android

import android.content.Context
import android.content.Intent
import com.scrymechat.android.notifications.NotificationHelper
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class NotificationDeepLinkTest {

    private lateinit var context: Context
    private lateinit var notificationHelper: NotificationHelper

    @Before
    fun setup() {
        context = RuntimeEnvironment.getApplication()
        notificationHelper = NotificationHelper(context)
    }

    @Test
    fun `test direct message notification intent`() {
        val data = mapOf(
            "title" to "New DM",
            "body" to "Hello there!",
            "type" to "direct_message",
            "entityId" to "dm123"
        )

        notificationHelper.showNotification(data)

        val notificationManager = shadowOf(context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager)
        val notifications = notificationManager.allNotifications
        // Expect 2: the conversation notification and the group summary
        assertEquals(2, notifications.size)

        val notification = notifications.find { it.flags and android.app.Notification.FLAG_GROUP_SUMMARY == 0 }!!
        val pendingIntent = notification.contentIntent
        val intent = shadowOf(pendingIntent).savedIntent

        assertEquals(MainActivity::class.java.name, intent.component?.className)
        assertEquals("direct_message", intent.getStringExtra("type"))
        assertEquals("dm123", intent.getStringExtra("entityId"))
    }

    @Test
    fun `test channel alert notification intent`() {
        val data = mapOf(
            "title" to "Channel Alert",
            "body" to "Check this out!",
            "type" to "channel_alert",
            "entityId" to "chan456"
        )

        notificationHelper.showNotification(data)

        val notificationManager = shadowOf(context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager)
        val notifications = notificationManager.allNotifications
        assertEquals(2, notifications.size)

        val notification = notifications.find { it.flags and android.app.Notification.FLAG_GROUP_SUMMARY == 0 }!!
        val pendingIntent = notification.contentIntent
        val intent = shadowOf(pendingIntent).savedIntent

        assertEquals("channel_alert", intent.getStringExtra("type"))
        assertEquals("chan456", intent.getStringExtra("entityId"))
    }

    @Test
    fun `test mention notification intent`() {
        val data = mapOf(
            "title" to "You were mentioned",
            "body" to "Hey @user!",
            "type" to "mention",
            "entityId" to "msg789",
            "entityType" to "channel"
        )

        notificationHelper.showNotification(data)

        val notificationManager = shadowOf(context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager)
        val notifications = notificationManager.allNotifications
        assertEquals(2, notifications.size)

        val notification = notifications.find { it.flags and android.app.Notification.FLAG_GROUP_SUMMARY == 0 }!!
        val pendingIntent = notification.contentIntent
        val intent = shadowOf(pendingIntent).savedIntent

        assertEquals("mention", intent.getStringExtra("type"))
        assertEquals("msg789", intent.getStringExtra("entityId"))
        assertEquals("channel", intent.getStringExtra("entityType"))
    }
}
