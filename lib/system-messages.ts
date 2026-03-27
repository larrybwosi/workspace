import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably"

/**
 * System message utilities for easy composition of standard messages
 */

interface SystemMessageOptions {
  channelId: string
  metadata?: Record<string, any>
  broadcast?: boolean
}

/**
 * Create a formatted system message
 */
export async function createSystemMessage(content: string, options: SystemMessageOptions) {
  const message = await prisma.message.create({
    data: {
      channelId: options.channelId,
      userId: "system",
      content,
      messageType: "system",
      metadata: options.metadata,
    },
    include: {
      user: true,
    },
  })

  if (options.broadcast !== false) {
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.thread(options.channelId))
    await channel.publish(AblyEvents.MESSAGE_SENT, message)
  }

  return message
}

/**
 * User joined/left messages
 */
export const userMessages = {
  joined: async (channelId: string, userName: string, userId: string) => {
    return createSystemMessage(`**${userName}** joined the conversation`, {
      channelId,
      metadata: {
        type: "user_joined",
        userId,
        userName,
      },
    })
  },

  left: async (channelId: string, userName: string, userId: string) => {
    return createSystemMessage(`**${userName}** left the conversation`, {
      channelId,
      metadata: {
        type: "user_left",
        userId,
        userName,
      },
    })
  },

  invited: async (channelId: string, inviterName: string, inviteeName: string) => {
    return createSystemMessage(`**${inviterName}** invited **${inviteeName}** to the conversation`, {
      channelId,
      metadata: {
        type: "user_invited",
        inviterName,
        inviteeName,
      },
    })
  },
}

/**
 * Integration system messages
 */
export const integrationMessages = {
  erpUpdate: async (channelId: string, message: string, data?: any) => {
    return createSystemMessage(`🔄 **ERP Update:** ${message}`, {
      channelId,
      metadata: {
        type: "erp_update",
        source: "erp",
        data,
      },
    })
  },

  externalSystem: async (channelId: string, systemName: string, message: string, data?: any) => {
    return createSystemMessage(`🔗 **${systemName}:** ${message}`, {
      channelId,
      metadata: {
        type: "external_system",
        source: systemName,
        data,
      },
    })
  },

  webhookReceived: async (channelId: string, webhookName: string, message: string, data?: any) => {
    return createSystemMessage(`📨 **${webhookName}:** ${message}`, {
      channelId,
      metadata: {
        type: "webhook",
        source: webhookName,
        data,
      },
    })
  },
}

/**
 * Custom integration message
 */
export async function createIntegrationMessage(
  channelId: string,
  config: {
    title: string
    message: string
    icon?: string
    linkUrl?: string
    linkText?: string
    source?: string
    data?: any
  },
) {
  const formattedMessage = `${config.icon || "🔗"} **${config.title}**\n${config.message}${
    config.linkUrl ? `\n[${config.linkText || "View Details"}](${config.linkUrl})` : ""
  }`

  return createSystemMessage(formattedMessage, {
    channelId,
    metadata: {
      type: "custom_integration",
      source: config.source || "external",
      data: config.data,
    },
  })
}
