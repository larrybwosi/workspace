export function extractUserMentions(content: string): string[] {
  // Extract @username mentions from content, excluding special mentions like @all and @here
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const mention = match[1];
    if (mention !== 'all' && mention !== 'here') {
      mentions.push(mention);
    }
  }

  return mentions;
}

export function extractChannelMentions(content: string): string[] {
  // Extract #channel mentions from content
  const channelRegex = /#(\w+)/g;
  const channels: string[] = [];
  let match;

  while ((match = channelRegex.exec(content)) !== null) {
    channels.push(match[1]);
  }

  return channels;
}

export function hasSpecialMention(content: string, type: 'all' | 'here'): boolean {
  const regex = new RegExp(`@${type}\\b`, 'g');
  return regex.test(content);
}

export function extractUserIds(mentions: string[], users: any[]): string[] {
  // ⚡ Optimization: O(N+M) lookup using Map instead of O(N*M)
  // This avoids repeated nested loops which would scale poorly as message size/user list grows.
  const userMap = new Map<string, string>();
  for (const user of users) {
    if (user.name && user.id) {
      userMap.set(user.name.toLowerCase(), user.id);
    }
  }

  // Use a Set to de-duplicate resulting user IDs (prevent multiple notifications)
  const userIds = new Set<string>();
  for (const mention of mentions) {
    const userId = userMap.get(mention.toLowerCase());
    if (userId) {
      userIds.add(userId);
    }
  }

  return Array.from(userIds);
}
