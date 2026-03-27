export function extractMentions(content: string): string[] {
  // Extract @username mentions from content
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return mentions
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
  // Replace @mentions with styled spans
  return content.replace(
    /@(\w+)/g,
    '<span class="bg-primary/10 text-primary font-medium px-1 rounded">@$1</span>'
  )
}
