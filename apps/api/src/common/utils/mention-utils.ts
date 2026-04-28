export function extractUserMentions(content: string): string[] {
  /**
   * ⚡ Performance Optimization:
   * Uses a pre-compiled regex with dot support to correctly extract usernames.
   * Regex: /@([\w.]+)/g supports alphanumeric, underscores, and dots.
   */
  const mentionRegex = /@([\w.]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const mention = match[1];
    // Filter out special mentions that are handled separately
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
  /**
   * ⚡ Performance Optimization:
   * Replaces O(N*M) nested lookup with O(N+M) Map-based resolution.
   * Prioritizes 'username' over 'name' for accuracy.
   * Expected impact: Significant CPU reduction for large messages or user lists.
   */
  const userMap = new Map<string, string>();

  // Build lookup map: username takes precedence over name
  for (const user of users) {
    if (!user.id) continue;

    if (user.name) {
      userMap.set(user.name.toLowerCase(), user.id);
    }
    if (user.username) {
      userMap.set(user.username.toLowerCase(), user.id);
    }
  }

  const userIds = new Set<string>();
  for (const mention of mentions) {
    const userId = userMap.get(mention.toLowerCase());
    if (userId) {
      userIds.add(userId);
    }
  }

  return Array.from(userIds);
}
