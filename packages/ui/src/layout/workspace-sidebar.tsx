'use client';

import * as React from 'react';
import {
  Plus,
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  Sparkles,
  Plug2,
  Hash,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../lib/utils';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useSession } from '@repo/shared';
import { WorkspaceSwitcher } from '../features/workspace/workspace-switcher';
import { UserProfileDialog } from '../features/social/user-profile-dialog';
import { CreateChannelDialog } from '../features/chat/create-channel-dialog';
import { useCreateWorkspaceChannel, useWorkspaceChannels } from '@repo/api-client';
import { User } from '../lib/types';
import { usePresence } from '../lib/contexts/presence-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  onClick?: () => void;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

function NavButton({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
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
            <item.icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground'
              )}
            />
            <span className="flex-1 truncate text-left">{item.label}</span>
            {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="lg:hidden">
          {item.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ChannelSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center h-9 px-3 gap-2.5">
          <Skeleton className="h-4 w-4 rounded shrink-0" />
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
        'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-sidebar',
        colorMap[status ?? 'offline'] ?? colorMap.offline
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function WorkspaceSidebar({ isOpen, onClose, currentWorkspaceId, onWorkspaceChange }: WorkspaceSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { slug } = useParams();

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false);

  const { data: channels, isLoading: channelsLoading } = useWorkspaceChannels(currentWorkspaceId ?? '');
  const createChannelMutation = useCreateWorkspaceChannel(currentWorkspaceId ?? '');

  const session = useSession();
  const sessionUser = session.data?.user;
  const { onlineUsers } = usePresence();

  const currentUser: User | undefined = sessionUser
    ? {
        id: sessionUser.id,
        name: sessionUser.name,
        avatar: sessionUser.image ?? '',
        role: 'Admin',
        status: onlineUsers.has(sessionUser.id) ? 'online' : 'offline',
      }
    : undefined;

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleCreateChannel = (channelData: { name: string; description: string; isPrivate: boolean }) => {
    createChannelMutation.mutate(
      {
        name: channelData.name,
        description: channelData.description,
        type: channelData.isPrivate ? 'private' : 'public',
      },
      { onSuccess: () => setCreateChannelOpen(false) }
    );
  };

  const navSections: NavSection[] = [
    {
      label: 'General',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: `/workspace/${slug}` },
        { icon: Sparkles, label: 'Assistant', href: `/workspace/${slug}/assistant` },
      ],
    },
    {
      label: 'Manage',
      items: [
        { icon: Users, label: 'Members', href: `/workspace/${slug}/members` },
        { icon: Plug2, label: 'Integrations', href: `/workspace/${slug}/integrations` },
        { icon: Settings, label: 'Settings', href: `/workspace/${slug}/settings` },
      ],
    },
  ];

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
        aria-label="Workspace navigation"
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
            {navSections.map(section => (
              <div key={section.label}>
                <SectionLabel>{section.label}</SectionLabel>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <NavButton
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href}
                      onClick={() => (item.onClick ? item.onClick() : handleNavigate(item.href))}
                    />
                  ))}
                </div>
              </div>
            ))}

            <Separator className="bg-sidebar-border" />

            {/* Channels */}
            <div>
              <div className="flex items-center justify-between px-3 mb-1">
                <SectionLabel>Channels</SectionLabel>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded text-muted-foreground hover:text-foreground"
                        onClick={() => setCreateChannelOpen(true)}
                        aria-label="Create channel"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">New channel</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-0.5">
                {channelsLoading ? (
                  <ChannelSkeleton />
                ) : channels?.length > 0 ? (
                  channels.map((channel: any) => {
                    const href = `/workspace/${slug}/channels/${channel.slug ?? channel.id}`;
                    const isActive = pathname === href;
                    const Icon = channel.type === 'private' ? Lock : Hash;

                    return (
                      <Button
                        key={channel.id}
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
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground'
                          )}
                        />
                        <span className="flex-1 truncate text-left">{channel.name}</span>
                        {channel.unreadCount > 0 && (
                          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                            {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                          </span>
                        )}
                      </Button>
                    );
                  })
                ) : (
                  <p className="px-3 py-3 text-xs text-muted-foreground/60 italic text-center">No channels yet</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* User footer */}
        <div className="shrink-0 border-t border-sidebar-border">
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-3 px-3 py-3',
              'text-left transition-colors hover:bg-sidebar-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            onClick={() => setProfileOpen(true)}
            aria-label="Open profile settings"
          >
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {currentUser?.name?.slice(0, 2).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <StatusDot status={currentUser?.status} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
                {currentUser?.name ?? 'User'}
              </p>
              <p className="text-xs text-muted-foreground capitalize leading-tight mt-0.5">
                {currentUser?.status ?? 'offline'}
              </p>
            </div>

            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          </button>
        </div>
      </aside>

      {/* Dialogs */}
      {currentUser && <UserProfileDialog user={currentUser} open={profileOpen} onOpenChange={setProfileOpen} />}

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        onCreateChannel={handleCreateChannel}
      />
    </>
  );
}
