import crypto from "crypto"

export interface IntegrationPayload {
  event: string
  workspace: {
    id: string
    name: string
  }
  data: Record<string, any>
  timestamp: string
}

export interface SlackMessage {
  text?: string
  blocks?: any[]
  attachments?: any[]
  channel?: string
  username?: string
  icon_emoji?: string
  icon_url?: string
}

export interface DiscordMessage {
  content?: string
  embeds?: DiscordEmbed[]
  username?: string
  avatar_url?: string
}

export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string; icon_url?: string }
  thumbnail?: { url: string }
  image?: { url: string }
  timestamp?: string
}

export const IntegrationService = {
  // Generate signature for webhook verification
  generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex")
  },

  // Verify incoming webhook signature
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.generateSignature(payload, secret)
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  },

  // Format message for Slack
  formatSlackMessage(payload: IntegrationPayload): SlackMessage {
    const { event, workspace, data } = payload

    const eventColors: Record<string, string> = {
      "task.created": "#36a64f",
      "task.completed": "#2eb886",
      "task.overdue": "#dc3545",
      "project.created": "#0066cc",
      "member.joined": "#6f42c1",
      "message.created": "#17a2b8",
    }

    return {
      text: `${event} in ${workspace.name}`,
      attachments: [
        {
          color: eventColors[event] || "#6366f1",
          title: this.formatEventTitle(event),
          text: this.formatEventDescription(event, data),
          fields: Object.entries(data)
            .filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key))
            .slice(0, 5)
            .map(([key, value]) => ({
              title: this.formatFieldName(key),
              value: typeof value === "object" ? JSON.stringify(value) : String(value),
              short: String(value).length < 30,
            })),
          footer: `Workspace: ${workspace.name}`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    }
  },

  // Format message for Discord
  formatDiscordMessage(payload: IntegrationPayload): DiscordMessage {
    const { event, workspace, data } = payload

    const eventColors: Record<string, number> = {
      "task.created": 0x36a64f,
      "task.completed": 0x2eb886,
      "task.overdue": 0xdc3545,
      "project.created": 0x0066cc,
      "member.joined": 0x6f42c1,
      "message.created": 0x17a2b8,
    }

    return {
      embeds: [
        {
          title: this.formatEventTitle(event),
          description: this.formatEventDescription(event, data),
          color: eventColors[event] || 0x6366f1,
          fields: Object.entries(data)
            .filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key))
            .slice(0, 5)
            .map(([key, value]) => ({
              name: this.formatFieldName(key),
              value: typeof value === "object" ? JSON.stringify(value) : String(value),
              inline: String(value).length < 30,
            })),
          footer: { text: `Workspace: ${workspace.name}` },
          timestamp: new Date().toISOString(),
        },
      ],
    }
  },

  // Format Microsoft Teams message
  formatTeamsMessage(payload: IntegrationPayload): Record<string, any> {
    const { event, workspace, data } = payload

    return {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: "6366f1",
      summary: `${event} in ${workspace.name}`,
      sections: [
        {
          activityTitle: this.formatEventTitle(event),
          activitySubtitle: `Workspace: ${workspace.name}`,
          facts: Object.entries(data)
            .filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key))
            .slice(0, 5)
            .map(([key, value]) => ({
              name: this.formatFieldName(key),
              value: typeof value === "object" ? JSON.stringify(value) : String(value),
            })),
          markdown: true,
        },
      ],
    }
  },

  formatEventTitle(event: string): string {
    const titles: Record<string, string> = {
      "task.created": "New Task Created",
      "task.completed": "Task Completed",
      "task.updated": "Task Updated",
      "task.overdue": "Task Overdue",
      "project.created": "New Project Created",
      "project.updated": "Project Updated",
      "member.joined": "New Member Joined",
      "member.left": "Member Left",
      "message.created": "New Message",
      "comment.created": "New Comment",
      "sprint.started": "Sprint Started",
      "sprint.completed": "Sprint Completed",
    }
    return titles[event] || event.replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  },

  formatEventDescription(event: string, data: Record<string, any>): string {
    switch (event) {
      case "task.created":
        return `Task "${data.title}" was created${data.assignee ? ` and assigned to ${data.assignee}` : ""}`
      case "task.completed":
        return `Task "${data.title}" was marked as completed${data.completedBy ? ` by ${data.completedBy}` : ""}`
      case "project.created":
        return `Project "${data.name}" was created`
      case "member.joined":
        return `${data.name || data.email} joined the workspace`
      case "message.created":
        return data.content?.slice(0, 200) || "New message"
      default:
        return data.description || data.message || `Event: ${event}`
    }
  },

  formatFieldName(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim()
  },

  // Send to Slack
  async sendToSlack(webhookUrl: string, message: SlackMessage): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      })
      return response.ok
    } catch (error) {
      console.error("[v0] Slack send failed:", error)
      return false
    }
  },

  // Send to Discord
  async sendToDiscord(webhookUrl: string, message: DiscordMessage): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      })
      return response.ok
    } catch (error) {
      console.error("[v0] Discord send failed:", error)
      return false
    }
  },

  // Send to Microsoft Teams
  async sendToTeams(webhookUrl: string, message: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      })
      return response.ok
    } catch (error) {
      console.error("[v0] Teams send failed:", error)
      return false
    }
  },

  // Send to custom webhook
  async sendToCustom(
    webhookUrl: string,
    payload: IntegrationPayload,
    secret: string,
    headers?: Record<string, string>,
  ): Promise<boolean> {
    try {
      const body = JSON.stringify(payload)
      const signature = this.generateSignature(body, secret)

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Timestamp": Date.now().toString(),
          ...headers,
        },
        body,
      })
      return response.ok
    } catch (error) {
      console.error("[v0] Custom webhook send failed:", error)
      return false
    }
  },
}
