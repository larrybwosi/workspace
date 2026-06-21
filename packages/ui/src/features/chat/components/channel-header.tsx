'use client';

import { memo } from 'react';
import { Phone, Video, Settings, Sidebar as SidebarIcon, Hash } from 'lucide-react';
import { Button } from '../../../components/button';

export const ChannelHeader = memo(({
  isWidget,
  channelName,
  onEdit,
  onToggleInfo
}: {
  isWidget?: boolean,
  channelName: string,
  onEdit: () => void,
  onToggleInfo?: () => void
}) => {
  if (isWidget) return null;

  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-background/50 backdrop-blur-md z-10">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="h-5 w-5" />
          <span className="text-sm">/</span>
          <span className="text-sm font-medium">v3.0</span>
          <span className="text-sm">/</span>
        </div>
        <h2 className="font-bold text-lg truncate">{channelName}</h2>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-xl hover:bg-muted">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-xl hover:bg-muted">
          <Video className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground rounded-xl hover:bg-muted"
          onClick={onEdit}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground rounded-xl hover:bg-muted"
          onClick={onToggleInfo}
        >
          <SidebarIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

ChannelHeader.displayName = 'ChannelHeader';
