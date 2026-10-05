'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useWorkspace,
  useWorkspaceAnalytics,
  useWorkspaceChannels,
  useWorkspaceMembers,
  useWorkspaceAuditLogs,
} from '@repo/api-client';
import {
  Users,
  MessageSquare,
  Hash,
  Activity,
  ArrowUpRight,
  Settings,
  UserPlus,
  Clock,
  AlertCircle,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  WorkspaceIcon,
  WorkspaceSidebar,
  DynamicHeader,
} from '@repo/ui';

export default function WorkspaceOverviewPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace(slug);
  const { data: analytics } = useWorkspaceAnalytics(slug);
  const { data: channels } = useWorkspaceChannels(slug);
  const { data: members } = useWorkspaceMembers(slug);
  const { data: auditLogs } = useWorkspaceAuditLogs(slug);

  const memberList = Array.isArray(members) ? members : (members as any)?.members ?? [];
  const channelList = Array.isArray(channels) ? channels : (channels as any)?.channels ?? [];
  const auditLogList = Array.isArray(auditLogs) ? auditLogs : auditLogs?.logs ?? [];

  if (isWorkspaceLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={slug} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <DynamicHeader activeView="Dashboard" onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />
          <div className="p-8 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto">
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={slug} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <DynamicHeader activeView="Dashboard" onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />
          <div className="p-12 text-center max-w-md mx-auto my-12 space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Workspace Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The workspace you are trying to access does not exist or you don't have access to it.
            </p>
            <Button onClick={() => router.push('/workspaces')} className="mt-4">
              Back to Workspaces
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={slug} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DynamicHeader activeView="Dashboard" onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full">
          {/* Workspace Banner & Header */}
          <div className="relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <WorkspaceIcon name={workspace.name} icon={workspace.icon} className="h-16 w-16 text-2xl rounded-2xl shadow-inner" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{workspace.name}</h1>
                    <Badge variant={workspace.isPublic ? 'secondary' : 'outline'} className="text-[10px] capitalize">
                      {workspace.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {workspace.description || 'Welcome to your workspace dashboard.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => router.push(`/workspace/${slug}/members`)}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Invite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => router.push(`/workspace/${slug}/settings`)}
                >
                  <Settings className="h-3.5 w-3.5" /> Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold mt-1">{memberList.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active Channels</p>
                  <p className="text-2xl font-bold mt-1">{channelList.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Hash className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Messages Sent</p>
                  <p className="text-2xl font-bold mt-1">{(analytics as any)?.totalMessages ?? '1.2k'}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Weekly Activity</p>
                  <p className="text-2xl font-bold mt-1">+18%</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="overview" className="w-full space-y-4">
            <TabsList className="bg-muted/50 p-1 border border-border/50 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg text-xs gap-1.5">
                <BarChart2 className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="channels" className="rounded-lg text-xs gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Channels
              </TabsTrigger>

              <TabsTrigger value="activity" className="rounded-lg text-xs gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Activity Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 border-border/60 bg-card/40">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Workspace Audit Overview
                    </CardTitle>
                    <CardDescription className="text-xs">Recent events and administrative activity across workspace</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {auditLogList.length > 0 ? (
                      auditLogList.slice(0, 6).map((log: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                          <Avatar className="h-8 w-8 mt-0.5">
                            <AvatarImage src={log.user?.avatar} />
                            <AvatarFallback>{log.actorName?.slice(0, 2) || 'A'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="text-foreground">
                              <span className="font-semibold">{log.actorName || 'System'}</span> {log.action || 'updated settings'}
                            </p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">
                              {log.createdAt || 'Recently'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground">No recent activity logged</div>
                    )}
                  </CardContent>
                </Card>

                {/* Workspace Members Preview */}
                <Card className="border-border/60 bg-card/40">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> Members
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => router.push(`/workspace/${slug}/members`)}
                      >
                        View all
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {memberList.slice(0, 5).map((m: any) => (
                      <div key={m.id || m.userId} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={m.user?.avatar || m.user?.image} />
                            <AvatarFallback className="text-[10px]">{m.user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{m.user?.name || m.name || 'Member'}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{m.role || 'Member'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="channels">
              <Card className="border-border/60 bg-card/40 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {channelList.map((ch: any) => (
                    <div
                      key={ch.id}
                      onClick={() => router.push(`/workspace/${slug}/channels/${ch.slug}`)}
                      className="p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-xs truncate">{ch.name}</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="border-border/60 bg-card/40 p-4 space-y-2">
                {auditLogList.map((log: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/40 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">{log.action}</span>
                      <span className="text-muted-foreground ml-2">by {log.actorName || 'System'}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{log.createdAt}</span>
                  </div>
                ))}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
