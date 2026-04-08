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
  // Convert usernames to user IDs
  return mentions
    .map((mention) => {
      const user = users.find((u) => u.name.toLowerCase() === mention.toLowerCase());
      return user?.id;
    })
    .filter(Boolean) as string[];
}
