'use client';

import { getAblyClient } from '@repo/shared';
import { useEffect, useState, createContext, useContext } from 'react';

const PRESENCE_CHANNEL = 'global-presence';

interface PresenceContextType {
  onlineUsers: Set<string>;
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: new Set() });

export function PresenceProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const ably = getAblyClient();

  useEffect(() => {
    if (!ably) return;

    const channel = ably.channels.get(PRESENCE_CHANNEL);

    const updatePresence = async () => {
      try {
        const presenceMessages = await channel.presence.get();
        const userIds = presenceMessages.map((msg: any) => msg.clientId);
        setOnlineUsers(new Set(userIds));
      } catch (error) {
        console.error('Error fetching presence:', error);
      }
    };

    if (userId) {
      channel.presence.enterClient(userId, { status: 'online' });
    }

    channel.presence.subscribe(['enter', 'present'], (member: any) => {
      setOnlineUsers(prev => new Set([...prev, member.clientId || member.userId]));
    });

    channel.presence.subscribe('leave', (member: any) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(member.clientId || member.userId);
        return next;
      });
    });

    const handleSync = (data: any) => {
      if (Array.isArray(data?.members)) {
        const ids = data.members.map((m: any) => m.userId || m.clientId);
        setOnlineUsers(prev => new Set([...prev, ...ids]));
      }
    };

    realtime.subscribe(PRESENCE_CHANNEL, 'presence:sync', handleSync);

    updatePresence();

    return () => {
      channel.presence.unsubscribe();
      realtime.unsubscribe(PRESENCE_CHANNEL, 'presence:sync', handleSync);
      if (userId) {
        channel.presence.leaveClient(userId);
      }
    };
  }, [ably, userId]);

  return <PresenceContext.Provider value={{ onlineUsers }}>{children}</PresenceContext.Provider>;
}

export const usePresence = () => useContext(PresenceContext);
