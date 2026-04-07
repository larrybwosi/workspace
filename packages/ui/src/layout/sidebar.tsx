'use client';

import * as React from 'react';
import { Plus, ChevronDown, Inbox, Bookmark, Sparkles, Users, FileText, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '../lib/auth/auth-client';
import { useNotifications } from '../hooks/api/use-notifications';
import { useDMConversations, dmKeys } from '../hooks/api/use-messages';
import { useQueryClient } from '@tanstack/react-query';
import { getAblyClient, AblyChannels, AblyEvents } from '../lib/integrations/ably';
import { WorkspaceSwitcher } from '../features/workspace/workspace-switcher';
import { UserProfileDialog } from '../features/social/user-profile-dialog';
import { StartDMDialog } from '../features/chat/start-dm-dialog';
import { User } from '../lib/types';
import { usePresence } from '../lib/contexts/presence-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeChannel: string;
  onChannelSelect: (channelId: string) => void;
  onMembersClick?: () => void;
  currentWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">{children}</p>
  );
}

function CollapsibleSectionHeader({
  label,
  isOpen,
  onToggle,
  count,
  onAction,
  actionLabel = 'New',
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  count?: number;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 mb-1">
      <button
        type="button"
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <ChevronRight className={cn('h-2.5 w-2.5 transition-transform duration-150', isOpen && 'rotate-90')} />
        {label}
        {count !== undefined && count > 0 && (
          <span className="ml-1 text-[10px] text-muted-foreground/50">({count})</span>
        )}
      </button>
      {onAction && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded text-muted-foreground hover:text-foreground"
                onClick={onAction}
                aria-label={actionLabel}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{actionLabel}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

function NavButton({
  icon: Icon,
  label,
  isActive,
  badge,
  badgeVariant = 'secondary',
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  badge?: React.ReactNode;
  badgeVariant?: 'secondary' | 'new';
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'w-full justify-start gap-2.5 h-9 px-3 rounded-md font-medium text-sm transition-all',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
      )}
      onClick={onClick}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground')} />
      <span className="flex-1 truncate text-left">{label}</span>
      {badge}
    </Button>
  );
}

function DMSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center h-9 px-3 gap-2.5">
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
          <Skeleton className="h-3 flex-1 rounded" />
        </div>
      ))}
    </>
  );
}

function StatusDot({ status }: { status?: string }) {
  const colorMap: Record<string, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-muted-foreground/40',
  };
  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 h-2 w-2 rounded-full border border-sidebar',
        colorMap[status ?? 'offline'] ?? colorMap.offline
      )}
    />
  );
}

function UserFooter({ user, onClick }: { user?: User; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 px-3 py-3',
        'text-left transition-colors hover:bg-sidebar-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      onClick={onClick}
      aria-label="Open profile settings"
    >
      <div className="relative shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatar} alt={user?.name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
          </AvatarFallback>
        </Avatar>
        <StatusDot status={user?.status} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">{user?.name ?? 'User'}</p>
        <p className="text-xs text-muted-foreground capitalize leading-tight mt-0.5">{user?.status ?? 'offline'}</p>
      </div>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function Sidebar({
  isOpen,
  onClose,
  activeChannel,
  onChannelSelect,
  currentWorkspaceId,
  onWorkspaceChange,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [dmsOpen, setDmsOpen] = React.useState(true);
  const [favoritesOpen, setFavoritesOpen] = React.useState(true);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [startDMOpen, setStartDMOpen] = React.useState(false);

  const session = useSession();
  const sessionUser = session.data?.user;
  const { onlineUsers } = usePresence();

  const { data: dmConversations = [], isLoading: dmsLoading } = useDMConversations();
  const { data: notificationsData } = useNotifications(true);
  const queryClient = useQueryClient();

  // Subscribe to real-time DM updates
  React.useEffect(() => {
    if (!sessionUser?.id) return;

    const ably = getAblyClient();
    if (!ably) return;

    const userChannel = ably.channels.get(AblyChannels.user(sessionUser.id));

    const handleDMUpdate = () => {
      queryClient.invalidateQueries({ queryKey: dmKeys.conversations() });
    };

    userChannel.subscribe(AblyEvents.DM_RECEIVED, handleDMUpdate);

    return () => {
      userChannel.unsubscribe(AblyEvents.DM_RECEIVED, handleDMUpdate);
    };
  }, [sessionUser?.id, queryClient]);

  const currentUser: User | undefined = sessionUser
    ? {
        id: sessionUser.id,
        name: sessionUser.name,
        avatar: sessionUser.image ?? '',
        role: 'Admin',
        status: onlineUsers.has(sessionUser.id) ? 'online' : 'offline',
      }
    : undefined;

  const notifCount: number = notificationsData?.total ?? notificationsData?.notifications?.length ?? 0;

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border',
          'transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Workspace switcher */}
        <div className="shrink-0 border-b border-sidebar-border p-2">
          <WorkspaceSwitcher currentWorkspaceId={currentWorkspaceId} onWorkspaceChange={onWorkspaceChange} />
        </div>

        {/* Scrollable nav */}
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-5 px-2">
            {/* Quick access */}
            <div>
              <SectionLabel>Quick access</SectionLabel>
              <div className="space-y-0.5">
                <NavButton
                  icon={Sparkles}
                  label="Assistant"
                  isActive={pathname === '/assistant'}
                  badge={
                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/15 text-blue-500 border-0 font-semibold">
                      NEW
                    </Badge>
                  }
                  onClick={() => handleNavigate('/assistant')}
                />
                <NavButton
                  icon={Inbox}
                  label="Inbox"
                  isActive={pathname === '/notifications' || activeChannel === 'notifications'}
                  badge={
                    notifCount > 0 ? (
                      <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {notifCount > 99 ? '99+' : notifCount}
                      </span>
                    ) : undefined
                  }
                  onClick={() => handleNavigate('/notifications')}
                />
                <NavButton
                  icon={Users}
                  label="Friends"
                  isActive={pathname === '/friends' || activeChannel === 'friends'}
                  onClick={() => handleNavigate('/friends')}
                />
                <NavButton
                  icon={FileText}
                  label="Drafts"
                  isActive={pathname === '/drafts'}
                  onClick={() => handleNavigate('/drafts')}
                />
                <NavButton
                  icon={Bookmark}
                  label="Saved items"
                  isActive={pathname === '/saved'}
                  onClick={() => handleNavigate('/saved')}
                />
              </div>
            </div>

            <Separator className="bg-sidebar-border" />

            {/* Direct messages */}
            <div>
              <CollapsibleSectionHeader
                label="Direct messages"
                isOpen={dmsOpen}
                onToggle={() => setDmsOpen(v => !v)}
                count={dmConversations.length}
                onAction={() => setStartDMOpen(true)}
                actionLabel="New message"
              />

              {dmsOpen && (
                <div className="space-y-0.5">
                  {dmsLoading ? (
                    <DMSkeleton count={3} />
                  ) : dmConversations.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-muted-foreground/60 italic text-center">
                      No conversations yet
                    </p>
                  ) : (
                    dmConversations.map((dm: any) => {
                      const other = dm.members.find((m: any) => m.id !== dm.creatorId) ?? dm.members[0];
                      const status = onlineUsers.has(other.id) ? 'online' : 'offline';
                      const dmId = `dm-${other.id}`;
                      const href = `/dm/${other.id}`;
                      const isActive = activeChannel === dmId || pathname === href;
                      const unread: number = dm._count?.messages ?? 0;

                      return (
                        <Button
                          key={dm.id}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'w-full justify-start gap-2.5 h-9 px-3 rounded-md text-sm font-medium transition-all',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                          )}
                          onClick={() => handleNavigate(href)}
                        >
                          <div className="relative shrink-0">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={other.avatar} alt={other.name} />
                              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-semibold">
                                {other.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <StatusDot status={status} />
                          </div>
                          <span className="flex-1 truncate text-left">{other.name}</span>
                          {unread > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </Button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Favorites */}
            <div>
              <CollapsibleSectionHeader
                label="Favorites"
                isOpen={favoritesOpen}
                onToggle={() => setFavoritesOpen(v => !v)}
              />
              {favoritesOpen && (
                <p className="px-3 py-3 text-xs text-muted-foreground/60 italic text-center">No favorites yet</p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* User footer */}
        <div className="shrink-0 border-t border-sidebar-border">
          <UserFooter user={currentUser} onClick={() => setProfileOpen(true)} />
        </div>
      </aside>

      {/* Dialogs */}
      {currentUser && <UserProfileDialog user={currentUser} open={profileOpen} onOpenChange={setProfileOpen} />}

      <StartDMDialog open={startDMOpen} onOpenChange={setStartDMOpen} />
    </>
  );
}
