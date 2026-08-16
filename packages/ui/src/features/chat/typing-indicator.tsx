'use client';

import { useEffect, useState, useRef } from 'react';
import { realtime, AblyChannels, AblyEvents } from '@repo/shared';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';

interface TypingIndicatorProps {
  channelId: string;
  currentUserId: string;
}

export function TypingIndicator({ channelId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!channelId) return;

    const room = channelId.startsWith('dm-')
      ? `dm:${channelId.replace('dm-', '')}`
      : channelId.startsWith('channel:') || channelId.startsWith('dm:') || channelId.startsWith('thread:')
        ? channelId
        : `channel:${channelId}`;

    const handleTyping = (data: any) => {
      const userId = data.userId;
      const displayName = data.userName || data.name || 'User';
      const avatar = data.avatar;

      if (!userId || userId === currentUserId) return;

      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== userId);
        return [...filtered, { userId, name: displayName, avatar }];
      });

      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      }, 3000);
    };

    realtime.subscribe(room, 'typing', handleTyping);

    return () => {
      realtime.unsubscribe(room, 'typing', handleTyping);
    };
  }, [channelId, currentUserId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map(user => (
          <Avatar key={user.userId} className="h-5 w-5 border-2 border-background">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-[8px]">{user.name[0]}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground font-medium">
          {typingUsers.length === 1
            ? `${typingUsers[0].name} is typing`
            : typingUsers.length === 2
              ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing`
              : `${typingUsers.length} people are typing`}
        </span>
        <span className="flex gap-0.5 mt-0.5">
          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" />
        </span>
      </div>
    </div>
  );
}

export function useTypingNotifier(channelId: string, user: any) {
  const typingTimeoutRef = useRef<any>(null);
  const isTypingRef = useRef(false);

  const room = channelId
    ? channelId.startsWith('dm-')
      ? `dm:${channelId.replace('dm-', '')}`
      : channelId.startsWith('channel:') || channelId.startsWith('dm:') || channelId.startsWith('thread:')
        ? channelId
        : `channel:${channelId}`
    : '';

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [channelId]);

  const notifyTyping = (isTyping: boolean) => {
    if (!room || !user) return;

    if (isTyping) {
      realtime.publish(room, 'typing', {
        userId: user.id,
        userName: user.name || user.username || 'User',
        avatar: user.avatar || user.image,
      });
    }

    isTypingRef.current = isTyping;
  };

  const handleKeyPress = () => {
    if (!isTypingRef.current) {
      notifyTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      notifyTyping(false);
    }, 3000);
  };

  return { handleKeyPress, stopTyping: () => notifyTyping(false) };
}
