'use client';

import { useParams } from 'next/navigation';
import { useWorkspaces, useCreateWorkspaceChannel } from '@repo/api-client';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Settings, ArrowRight, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreateChannelDialog } from '@/components/features/chat/create-channel-dialog';
import { InfoPanel } from '@/components/shared/info-panel';
import { Skeleton } from '@/components/ui/skeleton';

// Define a proper interface for your Workspace data
interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  members?: any[];
  _count?: {
    channels: number;
  };
}

export default function WorkspacePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { data: workspaces, isLoading } = useWorkspaces();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  // Memoize the workspace lookup for performance
  const workspace = useMemo(() => workspaces?.find((w: Workspace) => w.slug === slug), [workspaces, slug]);

  // Recommendation: Pass the workspace ID inside the mutate function
  // rather than at the hook level if your API client allows.
  const createChannelMutation = useCreateWorkspaceChannel(workspace?.id || '');

  const handleCreateChannel = (channelData: { name: string; description: string; isPrivate: boolean }) => {
    if (!workspace?.id) return;

    createChannelMutation.mutate(
      {
        name: channelData.name,
        description: channelData.description,
        type: channelData.isPrivate ? 'private' : 'public',
      },
      {
        onSuccess: () => {
          setCreateChannelOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex overflow-hidden bg-background">
        <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId="" />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <DynamicHeader activeView="Loading..." onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />
          <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-72" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Workspace not found</h1>
        <p className="text-muted-foreground">The workspace you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/">Go Back Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={workspace.id} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DynamicHeader
          activeView="Workspace Dashboard"
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
          onInfoClick={() => setInfoPanelOpen(prev => !prev)}
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8 overflow-y-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-sm shrink-0 text-white font-bold">
                  {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{workspace.name}</h1>
                  <p className="text-muted-foreground">{workspace.description || 'Welcome to your workspace!'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setCreateChannelOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Channel
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/workspace/${slug}/members`}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Members"
                value={workspace.members?.length || 0}
                description="Total workspace members"
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                actionLabel="View Members"
                actionHref={`/workspace/${slug}/members`}
              />

              <StatCard
                title="Channels"
                value={workspace._count?.channels || 0}
                description="Active communication channels"
                icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
                actionLabel="Create Channel"
                onActionClick={() => setCreateChannelOpen(true)}
              />

              <StatCard
                title="Settings"
                value="Configure"
                description="Workspace preferences"
                icon={<Settings className="h-4 w-4 text-muted-foreground" />}
                actionLabel="Open Settings"
                actionHref={`/workspace/${slug}/settings`}
              />
            </div>

            {/* Onboarding Section */}
            <Card className="bg-muted/30 border-none shadow-none">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Everything you need to set up your workspace</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <OnboardingStep
                  step={1}
                  title="Invite your team"
                  description="Add colleagues to start collaborating on projects together."
                />
                <OnboardingStep
                  step={2}
                  title="Create channels"
                  description="Organize discussions by topic, project, or department."
                />
                <OnboardingStep
                  step={3}
                  title="Explore integrations"
                  description="Connect your favorite tools to streamline your workflow."
                />
              </CardContent>
            </Card>
          </div>

          <InfoPanel
            isOpen={infoPanelOpen}
            onClose={() => setInfoPanelOpen(false)}
            type="workspace"
            id={workspace.id}
          />
        </div>
      </main>

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        onCreateChannel={handleCreateChannel}
      />
    </div>
  );
}

// Sub-components for cleaner code
function StatCard({ title, value, description, icon, actionLabel, actionHref, onActionClick }: any) {
  const content = (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <Button
          variant="ghost"
          className="w-full mt-4 justify-between px-2"
          onClick={onActionClick}
          asChild={!!actionHref}
        >
          {actionHref ? (
            <Link href={actionHref}>
              {actionLabel} <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          ) : (
            <>
              {actionLabel} <Plus className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
  return content;
}

function OnboardingStep({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border/50">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">
        {step}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
