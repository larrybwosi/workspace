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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="h-screen flex overflow-hidden bg-background">
        <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId="" />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-2xl font-bold">Workspace not found</h1>
        <p className="text-muted-foreground">The workspace you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/">Go Back Home</Link>
        </Button>
      </div>
    );
  }

  const recentChannels = channels?.slice(0, 5) ?? [];

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={workspace.id} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Minimal top bar for dashboard */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </Button>
            <span className="text-sm font-semibold text-muted-foreground">{workspace.name}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-sm font-semibold text-foreground">Dashboard</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreateChannelOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Channel
            </Button>
            <Button size="sm" asChild>
              <Link href={`/workspace/${slug}/members`}>
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Invite
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
            {/* Workspace hero */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary shrink-0">
                {workspace.icon || workspace.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{workspace.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {workspace.description || 'Welcome to your workspace — where teams get things done.'}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile
                label="Members"
                value={workspace._count?.members ?? 0}
                icon={<Users className="h-4 w-4" />}
                href={`/workspace/${slug}/members`}
              />
              <StatTile
                label="Channels"
                value={workspace._count?.channels ?? 0}
                icon={<MessageSquare className="h-4 w-4" />}
                onClick={() => setCreateChannelOpen(true)}
              />
              <StatTile
                label="Assistant"
                value="AI"
                icon={<Sparkles className="h-4 w-4" />}
                href={`/workspace/${slug}/assistant`}
              />
              <StatTile
                label="Tickets"
                value="Support"
                icon={<LifeBuoy className="h-4 w-4" />}
                href={`/workspace/${slug}/tickets`}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Recent channels */}
              <Card className="rounded-xl border-border shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Recent Channels</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setCreateChannelOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {channelsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-10 rounded-lg" />
                      ))}
                    </div>
                  ) : recentChannels.length > 0 ? (
                    <div className="space-y-0.5">
                      {recentChannels.map((channel: any) => {
                        const Icon = channel.type === 'private' ? Lock : Hash;
                        return (
                          <Link
                            key={channel.id}
                            href={`/workspace/${slug}/channels/${channel.slug ?? channel.id}`}
                            className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted transition-colors group"
                          >
                            <div
                              className={cn(
                                'flex items-center justify-center h-7 w-7 rounded-md shrink-0',
                                channel.type === 'private'
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-primary/10 text-primary'
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="flex-1 text-sm font-medium truncate text-foreground">{channel.name}</span>
                            {channel.unreadCount > 0 && (
                              <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px] shrink-0">
                                {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                              </Badge>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground">No channels yet</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setCreateChannelOpen(true)}>
                        Create your first channel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick actions / Getting started */}
              <Card className="rounded-xl border-border shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
                  <CardDescription className="text-xs">Everything you need to get started</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <QuickAction
                    icon={<Plus className="h-4 w-4" />}
                    title="Create a channel"
                    description="Organize discussions by topic or team"
                    onClick={() => setCreateChannelOpen(true)}
                  />
                  <QuickAction
                    icon={<UserPlus className="h-4 w-4" />}
                    title="Invite teammates"
                    description="Bring your colleagues into the workspace"
                    href={`/workspace/${slug}/members`}
                  />
                  <QuickAction
                    icon={<Sparkles className="h-4 w-4" />}
                    title="Try the AI assistant"
                    description="Get instant answers and automate tasks"
                    href={`/workspace/${slug}/assistant`}
                  />
                  <QuickAction
                    icon={<Settings className="h-4 w-4" />}
                    title="Configure workspace"
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
    <div className="flex flex-col gap-1 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer select-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
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
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
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
