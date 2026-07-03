'use client';

import { memo } from 'react';
import { Phone, Video, Settings, Sidebar as SidebarIcon, Hash, Lock, Users, ChevronDown, Bell, BellOff } from 'lucide-react';
import { Button } from '../../../components/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/tooltip';
import { Badge } from '../../../components/badge';
import { cn } from '../../../lib/utils';

export const ChannelHeader = memo(({
  isWidget,
  channelName,
  channelDescription,
  memberCount,
  isPrivate,
  onEdit,
  onToggleInfo
}: {
  isWidget?: boolean;
  channelName: string;
  channelDescription?: string;
  memberCount?: number;
  isPrivate?: boolean;
  onEdit: () => void;
  onToggleInfo?: () => void;
}) => {
  if (isWidget) return null;

  const Icon = isPrivate ? Lock : Hash;

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-sm z-10 shrink-0">
      {/* Left: Channel identity */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={cn(
          'flex items-center justify-center h-7 w-7 rounded-lg shrink-0',
          isPrivate ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
        )}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-[15px] leading-tight truncate text-foreground">{channelName}</h2>
            {isPrivate && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium shrink-0">Private</Badge>
            )}
          </div>
          {channelDescription && (
            <p className="text-[11px] text-muted-foreground truncate leading-tight">{channelDescription}</p>
          )}
        </div>

        {memberCount !== undefined && (
          <button
            className="hidden md:flex items-center gap-1 ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted shrink-0"
            onClick={onToggleInfo}
            title="View members"
          >
            <Users className="h-3.5 w-3.5" />
            <span>{memberCount}</span>
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted">
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start huddle</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted">
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start video call</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted"
                onClick={onEdit}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Channel settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted"
                onClick={onToggleInfo}
              >
                <SidebarIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle channel info</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
});

ChannelHeader.displayName = 'ChannelHeader';
