package com.scrymechat.android.ui.home

import com.scrymechat.android.data.local.entities.ChannelEntity
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ChannelSidebarGroupingTest {

    private fun createChannel(
        id: String,
        name: String,
        type: String = "channel",
        parentId: String? = null
    ) = ChannelEntity(
        id = id,
        name = name,
        slug = name.lowercase(),
        type = type,
        description = null,
        icon = "#",
        workspaceId = "ws-1",
        parentId = parentId,
        createdAt = "2025-01-01T00:00:00Z",
        updatedAt = "2025-01-01T00:00:00Z",
        unreadCount = 0,
        mentionCount = 0
    )

    @Test
    fun `sdk provisioned channels without categories default to Text Channels group`() {
        val channels = listOf(
            createChannel("ch-1", "general", type = "channel"),
            createChannel("ch-2", "random", type = "channel")
        )

        val (uncategorized, groups) = processChannelGrouping(channels)

        assertTrue(uncategorized.isEmpty())
        assertEquals(1, groups.size)
        assertEquals("Text Channels", groups[0].name)
        assertEquals(2, groups[0].channels.size)
        assertEquals("general", groups[0].channels[0].name)
        assertEquals("random", groups[0].channels[1].name)
    }

    @Test
    fun `sdk provisioned channels with custom category entity default to Text Channels group`() {
        val channels = listOf(
            createChannel("cat-1", "Information", type = "category"),
            createChannel("ch-1", "rules", type = "channel", parentId = "cat-1"),
            createChannel("ch-2", "sdk-provisioned-1", type = "channel", parentId = null),
            createChannel("ch-3", "sdk-provisioned-2", type = "channel", parentId = null)
        )

        val (uncategorized, groups) = processChannelGrouping(channels)

        assertTrue(uncategorized.isEmpty())
        assertEquals(2, groups.size)

        val textGroup = groups.find { it.name == "Text Channels" }
        val infoGroup = groups.find { it.name == "Information" }

        assertTrue(textGroup != null)
        assertTrue(infoGroup != null)

        assertEquals(2, textGroup!!.channels.size)
        assertEquals("sdk-provisioned-1", textGroup.channels[0].name)
        assertEquals("sdk-provisioned-2", textGroup.channels[1].name)

        assertEquals(1, infoGroup!!.channels.size)
        assertEquals("rules", infoGroup.channels[0].name)
    }

    @Test
    fun `sdk provisioned channels merge into existing Text Channels category entity`() {
        val channels = listOf(
            createChannel("cat-text", "Text Channels", type = "category"),
            createChannel("ch-1", "welcome", type = "channel", parentId = "cat-text"),
            createChannel("ch-2", "sdk-provisioned", type = "channel", parentId = null)
        )

        val (uncategorized, groups) = processChannelGrouping(channels)

        assertTrue(uncategorized.isEmpty())
        assertEquals(1, groups.size)
        assertEquals("Text Channels", groups[0].name)
        assertEquals(2, groups[0].channels.size)
        assertEquals("welcome", groups[0].channels[0].name)
        assertEquals("sdk-provisioned", groups[0].channels[1].name)
    }

    @Test
    fun `voice channels are grouped under Voice Channels`() {
        val channels = listOf(
            createChannel("ch-text", "general", type = "channel"),
            createChannel("ch-voice", "Lounge", type = "voice")
        )

        val (uncategorized, groups) = processChannelGrouping(channels)

        assertTrue(uncategorized.isEmpty())
        assertEquals(2, groups.size)

        val textGroup = groups.find { it.name == "Text Channels" }
        val voiceGroup = groups.find { it.name == "Voice Channels" }

        assertTrue(textGroup != null)
        assertTrue(voiceGroup != null)

        assertEquals(1, textGroup!!.channels.size)
        assertEquals("general", textGroup.channels[0].name)

        assertEquals(1, voiceGroup!!.channels.size)
        assertEquals("Lounge", voiceGroup.channels[0].name)
    }
}
