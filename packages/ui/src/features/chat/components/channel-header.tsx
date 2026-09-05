'use client';

import { memo } from 'react';
import { Phone, Video, Settings, Sidebar as SidebarIcon, Hash, Lock, Users, Info } from 'lucide-react';
import { Button } from '../../../components/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/tooltip';
import { Badge } from '../../../components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/avatar';
import { cn } from '../../../lib/utils';

export const ChannelHeader = memo(({
  isWidget,
  channelName,
  channelDescription,
  memberCount,
  isPrivate,
  isDm,
  dmUser,
  isOnline,
  onEdit,
  onToggleInfo,
  onToggleSidebar
}: {
  isWidget?: boolean;
  channelName: string;
  channelDescription?: string;
  memberCount?: number;
  isPrivate?: boolean;
  isDm?: boolean;
  dmUser?: any;
  isOnline?: boolean;
  onEdit: () => void;
  onToggleInfo?: () => void;
  onToggleSidebar?: () => void;
}) => {
  if (isWidget) return null;

  const Icon = isPrivate ? Lock : Hash;
  const displayName = isDm ? (dmUser?.name || channelName.replace(/^@/, '')) : channelName;
  const statusLabel = isOnline ? 'Active now' : (dmUser?.status === 'away' ? 'Away' : 'Offline');

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-sm z-10 shrink-0">
      {/* Left: Channel or DM identity */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted shrink-0"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation"
          >
            <SidebarIcon className="h-4 w-4" />
          </Button>
        )}

        {isDm ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={dmUser?.avatar || dmUser?.image} alt={displayName} />
                <AvatarFallback className="text-[11px] font-bold bg-primary text-primary-foreground">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                  isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'
                )}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-[14px] leading-tight truncate text-foreground">
                {displayName}
              </span>
              <span className={cn(
                'text-[11px] leading-tight truncate',
                isOnline ? 'text-green-500' : 'text-muted-foreground'
              )}>
                {statusLabel}
              </span>
            </div>
          </div>
        ) : (
          <>
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
          </>
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
            <TooltipContent>{isDm ? 'Voice call' : 'Start huddle'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted">
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDm ? 'Video call' : 'Start video call'}</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-1" />

          {!isDm && (
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
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted"
                onClick={onToggleInfo}
              >
                {isDm ? <Info className="h-4 w-4" /> : <SidebarIcon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDm ? 'User info' : 'Toggle channel info'}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
});

ChannelHeader.displayName = 'ChannelHeader';
