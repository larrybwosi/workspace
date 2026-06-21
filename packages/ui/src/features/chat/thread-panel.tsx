'use client';

import { X } from 'lucide-react';
import { Button } from '../../components/button';
import { ChannelView } from './channel-view';
import { Message } from '@repo/types';

interface ThreadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  workspaceId: string;
  parentMessage: Message | null;
}

export function ThreadPanel({
  isOpen,
  onClose,
  channelId,
  workspaceId,
  parentMessage,
}: ThreadPanelProps) {
  if (!isOpen || !parentMessage) return null;

  return (
    <div className="w-[400px] border-l border-border flex flex-col h-full bg-background z-20 animate-in slide-in-from-right duration-300">
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
        <div className="flex flex-col">
          <h3 className="font-bold text-sm">Thread</h3>
          <span className="text-[11px] text-muted-foreground truncate">
            in #{channelId}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChannelView
          channelId={channelId}
          workspaceId={workspaceId}
          threadId={parentMessage.id}
          isWidget={true} // Use widget mode for a more compact view if needed, or just reuse
        />
      </div>
    </div>
  );
}
