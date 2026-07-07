'use client';

import { useParams, useRouter } from 'next/navigation';
import { useWorkspaces, useCreateWorkspaceChannel, useWorkspace, useWorkspaceChannels } from '@repo/api-client';
import { WorkspaceSidebar, useBranding } from '@repo/ui';
import { useState, useMemo } from 'react';
import {
  Users,
  MessageSquare,
  Settings,
  ArrowRight,
  Plus,
  UserPlus,
  Hash,
  Lock,
  Activity,
  ChevronRight,
  Sparkles,
  LifeBuoy,
  ShieldCheck,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { CreateChannelDialog } from '@/components/features/chat/create-channel-dialog';
import { cn } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  plan?: string;
  members?: any[];
  _count?: {
    members: number;
    channels: number;
  };
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { data: workspaceData } = useWorkspace(slug);
  useBranding(workspaceData?.brandingConfig);

  const { data: workspaces, isLoading } = useWorkspaces();
  const { data: channels, isLoading: channelsLoading } = useWorkspaceChannels(slug ?? '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);

  const workspace = useMemo(() => workspaces?.find((w: Workspace) => w.slug === slug), [workspaces, slug]);

  const createChannelMutation = useCreateWorkspaceChannel(slug || '');

  const handleCreateChannel = (channelData: { name: string; description: string; isPrivate: boolean }) => {
    if (!slug) return;
    createChannelMutation.mutate(
      {
        name: channelData.name,
        description: channelData.description,
        type: channelData.isPrivate ? 'private' : 'public',
      },
      { onSuccess: () => setCreateChannelOpen(false) }
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex overflow-hidden bg-background">
        <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId="" />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="h-14 border-b border-border shrink-0" />
          <div className="p-8 w-full space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-3.5 w-80" />
              </div>
            </div>
            <div className="grid gap-px bg-border rounded-md overflow-hidden border border-border md:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 rounded-none" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-xl font-semibold text-foreground">Workspace not found</h1>
        <p className="text-sm text-muted-foreground">The workspace you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    );
  }

  const recentChannels = channels?.slice(0, 6) ?? [];

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={workspace.id} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </Button>
            <span className="text-sm font-medium text-muted-foreground truncate">{workspace.name}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            <span className="text-sm font-semibold text-foreground">Overview</span>
            <Badge
              variant="outline"
              className="ml-2 h-5 gap-1 rounded-sm border-border px-1.5 text-[10px] font-medium text-muted-foreground hidden sm:inline-flex"
            >
              <Circle className="h-1.5 w-1.5 fill-emerald-500 text-emerald-500" />
              All systems operational
            </Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCreateChannelOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New channel
            </Button>
            <Button size="sm" className="h-8 text-xs" asChild>
              <Link href={`/workspace/${slug}/members`}>
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Invite members
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="w-full">
            {/* Workspace identity strip */}
            <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                  {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">{workspace.name}</h1>
                    <Badge
                      variant="secondary"
                      className="h-5 rounded-sm px-1.5 text-[10px] font-semibold uppercase tracking-wide"
                    >
                      {workspace.plan || 'Enterprise'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {workspace.description || 'Workspace overview, activity, and administration'}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <ShieldCheck className="h-3.5 w-3.5" />
                SSO &amp; audit logging enabled
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border divide-x divide-border">
              <StatTile
                label="Members"
                value={workspace._count?.members ?? 0}
                icon={<Users className="h-3.5 w-3.5" />}
                href={`/workspace/${slug}/members`}
              />
              <StatTile
                label="Channels"
                value={workspace._count?.channels ?? 0}
                icon={<MessageSquare className="h-3.5 w-3.5" />}
                onClick={() => setCreateChannelOpen(true)}
              />
              <StatTile
                label="Assistant"
                value="Active"
                icon={<Sparkles className="h-3.5 w-3.5" />}
                href={`/workspace/${slug}/assistant`}
              />
              <StatTile
                label="Support"
                value="Tickets"
                icon={<LifeBuoy className="h-3.5 w-3.5" />}
                href={`/workspace/${slug}/tickets`}
              />
            </div>

            {/* Content grid */}
            <div className="grid lg:grid-cols-3">
              {/* Recent channels */}
              <Card className="rounded-none border-0 border-b lg:border-b-0 lg:border-r border-border shadow-none lg:col-span-2">
                <CardHeader className="pb-3 pt-5 px-8 flex-row items-center justify-between space-y-0">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channels</p>
                    <p className="text-sm text-foreground mt-0.5">Recent activity across your workspace</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setCreateChannelOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    New
                  </Button>
                </CardHeader>
                <CardContent className="px-8 pb-6">
                  {channelsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-11 rounded-md" />
                      ))}
                    </div>
                  ) : recentChannels.length > 0 ? (
                    <div className="border border-border rounded-md divide-y divide-border overflow-hidden">
                      {recentChannels.map((channel: any) => {
                        const Icon = channel.type === 'private' ? Lock : Hash;
                        return (
                          <Link
                            key={channel.id}
                            href={`/workspace/${slug}/channels/${channel.slug ?? channel.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                          >
                            <div
                              className={cn(
                                'flex items-center justify-center h-7 w-7 rounded-md shrink-0 border',
                                channel.type === 'private'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-primary/10 text-primary border-primary/20'
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="flex-1 text-sm font-medium truncate text-foreground">{channel.name}</span>
                            {channel.unreadCount > 0 && (
                              <Badge variant="default" className="h-5 min-w-5 px-1.5 rounded-sm text-[10px] shrink-0">
                                {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                              </Badge>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center border border-dashed border-border rounded-md">
                      <p className="text-sm font-medium text-foreground">No channels yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create a channel to start organizing conversations.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-8 text-xs"
                        onClick={() => setCreateChannelOpen(true)}
                      >
                        Create your first channel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick actions / Admin */}
              <Card className="rounded-none border-0 shadow-none">
                <CardHeader className="pb-3 pt-5 px-8">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Administration</p>
                  <p className="text-sm text-foreground mt-0.5">Setup and governance</p>
                </CardHeader>
                <CardContent className="px-8 pb-6 space-y-1">
                  <QuickAction
                    icon={<Plus className="h-4 w-4" />}
                    title="Create a channel"
                    description="Organize discussions by topic or team"
                    onClick={() => setCreateChannelOpen(true)}
                  />
                  <QuickAction
                    icon={<UserPlus className="h-4 w-4" />}
                    title="Invite teammates"
                    description="Bring colleagues into the workspace"
                    href={`/workspace/${slug}/members`}
                  />
                  <QuickAction
                    icon={<Sparkles className="h-4 w-4" />}
                    title="AI assistant"
                    description="Automate routine work and answer questions"
                    href={`/workspace/${slug}/assistant`}
                  />
                  <QuickAction
                    icon={<Activity className="h-4 w-4" />}
                    title="Audit log"
                    description="Review member and admin activity"
                    href={`/workspace/${slug}/activity`}
                  />
                  <QuickAction
                    icon={<Settings className="h-4 w-4" />}
                    title="Workspace settings"
                    description="Branding, integrations, and permissions"
                    href={`/workspace/${slug}/settings`}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        workspaceSlug={slug}
        onCreateChannel={handleCreateChannel as any}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  icon,
  href,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex flex-col gap-2 px-8 py-5 hover:bg-muted/40 transition-colors cursor-pointer select-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return <div onClick={onClick}>{inner}</div>;
}

function QuickAction({
  icon,
  title,
  description,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted transition-colors cursor-pointer group">
      <div className="h-8 w-8 rounded-md border border-border bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return <div onClick={onClick}>{inner}</div>;
}
