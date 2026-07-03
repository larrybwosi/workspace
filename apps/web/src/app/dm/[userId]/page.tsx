'use client';

import * as React from 'react';
import { Loader2, Phone, Video, Info, MoreHorizontal, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceSidebar, WorkspaceRail, DynamicHeader, usePresence } from '@repo/ui';
import { ChannelView } from '@/components/features/chat/channel-view';
import { InfoPanel } from '@/components/shared/info-panel';
import { useUser } from '@repo/api-client';
import { cn } from '@/lib/utils';

export default function DMPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = React.useState(false);

  const { data: dmUser, isLoading } = useUser(userId);
  const { onlineUsers } = usePresence();
  const channelId = `dm-${userId}`;
  const isOnline = onlineUsers.has(userId);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dmUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">The user you&apos;re trying to message doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/channels/general')}>Go to General Channel</Button>
        </div>
      </div>
    );
  }

  const displayName = (dmUser as any).name || 'Unknown User';
  const statusLabel = isOnline ? 'Active now' : ((dmUser as any).status === 'away' ? 'Away' : 'Offline');

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Rail + Sidebar */}
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* DM-specific header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-sm shrink-0 z-10">
          {/* Left: menu toggle + user info */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </Button>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={(dmUser as any).avatar || (dmUser as any).image} alt={displayName} />
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
          </div>

          {/* Right: action buttons */}
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted">
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice call</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted">
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video call</TooltipContent>
              </Tooltip>

              <div className="w-px h-4 bg-border mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 rounded-lg hover:bg-muted transition-colors',
                      infoPanelOpen
                        ? 'text-primary bg-primary/10 hover:bg-primary/15'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setInfoPanelOpen(v => !v)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>User info</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </header>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ChannelView
              channelId={channelId}
              onToggleInfo={() => setInfoPanelOpen(v => !v)}
            />
          </main>

          <InfoPanel
            isOpen={infoPanelOpen}
            onClose={() => setInfoPanelOpen(false)}
            dmUser={dmUser}
          />
        </div>
      </div>
    </div>
  );
}
