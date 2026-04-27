export function extractUserMentions(content: string): string[] {
  /**
   * ⚡ Performance Optimization & Bug Fix:
   * Updated regex to support dots in usernames (e.g., @john.doe).
   * Uses a single pass to extract all valid mentions while skipping @all/@here.
   */
  const mentionRegex = /@([\w.]+)/g
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
  /**
   * ⚡ Optimization: O(N+M) lookup using Map instead of O(N*M).
   * Updated to support matching by both 'name' and 'username', preferring 'username'.
   * This handles the core mention resolution logic used by notifications.
   */
  const userMap = new Map<string, string>()
  for (const user of users) {
    if (user.id) {
      // Set name match
      if (user.name) {
        userMap.set(user.name.toLowerCase(), user.id)
      }
      // Set username match (overwrites name match if they clash, as username is more specific)
      if (user.username) {
        userMap.set(user.username.toLowerCase(), user.id)
      }
    }
  }

  const userIds = new Set<string>()
  for (const mention of mentions) {
    const userId = userMap.get(mention.toLowerCase())
    if (userId) {
      userIds.add(userId)
    }
  }

  return Array.from(userIds)
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
