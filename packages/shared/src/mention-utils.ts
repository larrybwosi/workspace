export function extractUserMentions(content: string): string[] {
  // Extract @username mentions from content, excluding special mentions like @all and @here
  // Supporting dots in usernames (e.g., @john.doe)
  const mentionRegex = /@([\w.]+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    const mention = match[1]
    // Remove trailing dot if it's likely punctuation at the end of a sentence
    const cleanMention = mention.endsWith(".") ? mention.slice(0, -1) : mention

    if (cleanMention !== "all" && cleanMention !== "here") {
      mentions.push(cleanMention)
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
  // ⚡ Optimization: O(N+M) lookup using Map instead of O(N*M)
  // This avoids repeated nested loops which would scale poorly as message size/user list grows.
  const usernameMap = new Map<string, string>()
  const nameMap = new Map<string, string>()

  for (const user of users) {
    if (user.username && user.id) {
      usernameMap.set(user.username.toLowerCase(), user.id)
    }
    if (user.name && user.id) {
      nameMap.set(user.name.toLowerCase(), user.id)
    }
  }

  // Use a Set to de-duplicate resulting user IDs (prevent multiple notifications)
  const userIds = new Set<string>()
  for (const mention of mentions) {
    const mentionLower = mention.toLowerCase()
    // Prioritize username match
    const userIdByUsername = usernameMap.get(mentionLower)
    if (userIdByUsername) {
      userIds.add(userIdByUsername)
    } else {
      // Fallback to name match
      const userIdByName = nameMap.get(mentionLower)
      if (userIdByName) {
        userIds.add(userIdByName)
      }
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
