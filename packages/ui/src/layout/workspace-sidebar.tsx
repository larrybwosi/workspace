'use client';

import * as React from 'react';
import {
  Plus,
  Search,
  Lock,
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  Users,
  LifeBuoy,
  Settings,
  Sparkles,
  Plug2,
  Hash,
  ChevronRight,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import { Button } from '../components/button';
import { ScrollArea } from '../components/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/tooltip';
import { Separator } from '../components/separator';
import { Skeleton } from '../components/skeleton';
import { cn } from '../lib/utils';
import { useRouter, useParams, usePathname } from '../hooks/use-universal-router';
import { useSession } from '@repo/shared';
import { WorkspaceSwitcher } from '../features/workspace/workspace-switcher';
import { WorkspaceRail } from './workspace-rail';
import { useCommandPalette } from './command-palette-provider';
import { UserProfileDialog } from '../features/social/user-profile-dialog';
import { CreateChannelDialog } from '../features/chat/create-channel-dialog';
import { CreateWorkspaceDialog } from '../features/workspace/create-workspace-dialog';
import { CreateTicketDialog } from '../features/support/create-ticket-dialog';
import { useCreateWorkspaceChannel, useWorkspaceChannels, useWorkspace, useFriends } from '@repo/api-client';
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
  onChannelSelect?: (channelId: string) => void;
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

function StatusDot({ status, className }: { status?: string; className?: string }) {
  const colorMap: Record<string, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-muted-foreground/40',
  };
  return (
    <span
      className={cn(
        'shrink-0 h-2 w-2 rounded-full ring-1 ring-sidebar',
        colorMap[status ?? 'offline'] ?? colorMap.offline,
        className
      )}
    />
  );
}

// Collapsible section wrapper
function CollapsibleSection({
  label,
  isCollapsed,
  onToggle,
  actionIcon,
  actionLabel,
  onAction,
  children,
}: {
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
  actionIcon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-3 mb-1 group/section">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <ChevronRight className={cn('h-3 w-3 transition-transform duration-150', !isCollapsed && 'rotate-90')} />
          {label}
        </button>
        {onAction && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover/section:opacity-100 transition-opacity"
                  onClick={e => { e.stopPropagation(); onAction(); }}
                  aria-label={actionLabel}
                >
                  {actionIcon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{actionLabel}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {!isCollapsed && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function WorkspaceSidebar({ isOpen, onClose, onWorkspaceChange, onChannelSelect }: WorkspaceSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { slug } = useParams();
  const workspaceSlug = slug as string;

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);
  const [createTicketOpen, setCreateTicketOpen] = React.useState(false);
  const [channelsCollapsed, setChannelsCollapsed] = React.useState(false);
  const [dmsCollapsed, setDmsCollapsed] = React.useState(false);

  const { data: workspace } = useWorkspace(workspaceSlug ?? '');
  const { data: channels, isLoading: channelsLoading } = useWorkspaceChannels(workspaceSlug ?? '');
  const createChannelMutation = useCreateWorkspaceChannel(workspaceSlug ?? '');
  const session = useSession();
  const sessionUser = session.data?.user;
  const { onlineUsers } = usePresence();
  const commandPalette = useCommandPalette();

  // Friends/DM list
  const { data: friends, isLoading: friendsLoading } = useFriends();

  const currentUser: User | undefined = sessionUser
    ? {
        id: sessionUser.id,
        name: sessionUser.name,
        avatar: sessionUser.image ?? '',
        role: 'Admin',
        status: onlineUsers.has(sessionUser.id) ? 'online' : 'offline',
      }
    : undefined;

  const handleNavigate = (href: string, id?: string) => {
    if (onChannelSelect && id) {
      onChannelSelect(id);
    } else {
      router.push(href);
    }
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
          'fixed inset-y-0 left-0 z-50 flex h-full bg-sidebar border-r border-sidebar-border',
          'transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <WorkspaceRail onPlusClick={() => setCreateWorkspaceOpen(true)} />

        <div className="flex w-64 flex-col h-full">
          {/* Workspace title area */}
          <div className="h-14 flex items-center px-4 border-b border-sidebar-border/50">
            <h1 className="text-[15px] font-semibold truncate capitalize flex-1 px-1">
              {workspace?.name || slug?.toString().replace(/-/g, ' ') || 'Workspace'}
            </h1>
          </div>

          {/* Search trigger */}
          <div className="px-3 pt-3">
            <button
              type="button"
              onClick={() => commandPalette.setOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search workspace"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left truncate">Search...</span>
              <kbd className="pointer-events-none hidden items-center gap-0.5 rounded border border-sidebar-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
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
                        onClick={() =>
                          item.onClick ? item.onClick() : handleNavigate(item.href, item.label.toLowerCase())
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}

              <Separator className="bg-sidebar-border" />

              {/* Support tickets */}
              <div>
                <div className="flex items-center justify-between px-3 mb-1">
                  <SectionLabel>Support</SectionLabel>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded text-muted-foreground hover:text-foreground"
                          onClick={() => setCreateTicketOpen(true)}
                          aria-label="Create ticket"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">New ticket</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="space-y-0.5 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'w-full justify-start gap-2.5 h-9 px-3 rounded-md text-sm font-medium transition-all',
                      pathname === `/workspace/${slug}/tickets`
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                    onClick={() => handleNavigate(`/workspace/${slug}/tickets`)}
                  >
                    <LifeBuoy className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate text-left">All Tickets</span>
                  </Button>
                </div>
              </div>

              {/* Channels — collapsible */}
              <CollapsibleSection
                label="Channels"
                isCollapsed={channelsCollapsed}
                onToggle={() => setChannelsCollapsed(v => !v)}
                actionIcon={<Plus className="h-3.5 w-3.5" />}
                actionLabel="New channel"
                onAction={() => setCreateChannelOpen(true)}
              >
                {channelsLoading ? (
                  <ChannelSkeleton />
                ) : channels?.length > 0 ? (
                  channels.map((channel: any) => {
                    const href = `/workspace/${slug}/channels/${channel.slug ?? channel.id}`;
                    const isActive = pathname === href;
                    const Icon = channel.type === 'private' ? Lock : Hash;
                    const hasUnread = (channel.unreadCount ?? 0) > 0;

                    return (
                      <Button
                        key={channel.id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'w-full justify-start gap-2.5 h-9 px-3 rounded-md text-sm font-medium transition-all',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : hasUnread
                              ? 'text-sidebar-foreground font-semibold hover:bg-sidebar-accent/50'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )}
                        onClick={() => handleNavigate(href, channel.slug ?? channel.id)}
                      >
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground'
                          )}
                        />
                        <span className="flex-1 truncate text-left">{channel.name}</span>
                        {hasUnread && (
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
              </CollapsibleSection>

            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Dialogs */}
      {currentUser && <UserProfileDialog user={currentUser} open={profileOpen} onOpenChange={setProfileOpen} />}

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        workspaceSlug={workspaceSlug}
        onCreateChannel={handleCreateChannel}
      />

      <CreateWorkspaceDialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />

      {workspace && (
        <CreateTicketDialog open={createTicketOpen} onOpenChange={setCreateTicketOpen} workspaceId={workspace.id} />
      )}
    </>
  );
}
