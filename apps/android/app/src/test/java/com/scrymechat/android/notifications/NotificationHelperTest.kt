package com.scrymechat.android.notifications

import org.junit.Assert.assertEquals
import org.junit.Test

class NotificationHelperTest {

    @Test
    fun testChannelMapping() {
        val typeToChannel = mapOf(
            "direct_message" to NotificationHelper.CHANNEL_URGENT,
            "mention" to NotificationHelper.CHANNEL_URGENT,
            "friend_request" to NotificationHelper.CHANNEL_URGENT,
            "channel_alert" to NotificationHelper.CHANNEL_HIGH,
            "system" to NotificationHelper.CHANNEL_NORMAL
        )

        typeToChannel.forEach { (type, expectedChannel) ->
            val actualChannel = when (type) {
                "direct_message", "mention", "friend_request" -> NotificationHelper.CHANNEL_URGENT
                "channel_alert" -> NotificationHelper.CHANNEL_HIGH
                else -> NotificationHelper.CHANNEL_NORMAL
            }
            assertEquals("Channel for $type should match", expectedChannel, actualChannel)
        }
    }
}
