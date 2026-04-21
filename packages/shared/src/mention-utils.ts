export function extractUserMentions(content: string): string[] {
  // Extract @username mentions from content, excluding special mentions like @all and @here
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    const mention = match[1]
    if (mention !== "all" && mention !== "here") {
      mentions.push(mention)
    }
  }

  return mentions
}

export function extractChannelMentions(content: string): string[] {
  // Extract #channel mentions from content
  const channelRegex = /#(\w+)/g
  const channels: string[] = []
  let match

  while ((match = channelRegex.exec(content)) !== null) {
    channels.push(match[1])
  }

  return channels
}

export function hasSpecialMention(content: string, type: "all" | "here"): boolean {
  const regex = new RegExp(`@${type}\\b`, "g")
  return regex.test(content)
}

export function extractUserIds(mentions: string[], users: any[]): string[] {
  // Convert usernames to user IDs
  return mentions
    .map((mention) => {
      const user = users.find((u) => u.name.toLowerCase() === mention.toLowerCase())
      return user?.id
    })
    .filter(Boolean) as string[]
}

export function highlightMentions(content: string): string {
  // Replace @mentions (user, all, here) and #channels with styled spans
  let highlighted = content

  // Highlight @user, @all, @here
  highlighted = highlighted.replace(
    /@(\w+)/g,
    (match, p1) => {
      const isSpecial = p1 === "all" || p1 === "here"
      const colorClass = isSpecial ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
      return `<span class="${colorClass} font-medium px-1 rounded cursor-pointer mention-user" data-user="${p1}">@${p1}</span>`
    }
  )

  // Highlight #channel
  highlighted = highlighted.replace(
    /#(\w+)/g,
    '<span class="bg-blue-100 text-blue-700 font-medium px-1 rounded cursor-pointer mention-channel" data-channel="$1">#$1</span>'
  )

  return highlighted
}
