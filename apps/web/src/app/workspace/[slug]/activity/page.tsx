'use client';

import { useParams } from 'next/navigation';
import { useWorkspace } from '@repo/api-client';
import { WorkspaceSidebar, useBranding } from '@repo/ui';
import { useState } from 'react';
import { Activity, ShieldCheck, ChevronRight, Clock, User, MessageSquare, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditEvent {
  id: string;
  type: 'user' | 'security' | 'channel' | 'system';
  message: string;
  user: string;
  timestamp: string;
  ipAddress?: string;
}

const mockAuditLogs: AuditEvent[] = [
  {
    id: 'log-1',
    type: 'security',
    message: 'SSO configuration updated successfully by workspace owner',
    user: 'Sarah Jenkins (Owner)',
    timestamp: '2 hours ago',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'log-2',
    type: 'channel',
    message: 'New private channel #executive-planning created',
    user: 'Sarah Jenkins (Owner)',
    timestamp: '5 hours ago',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'log-3',
    type: 'user',
    message: 'New workspace invitation sent to Alex River (alex@example.com)',
    user: 'Michael Chang (Admin)',
    timestamp: '1 day ago',
    ipAddress: '192.168.1.12',
  },
  {
    id: 'log-4',
    type: 'security',
    message: 'Failed login attempt detected from unrecognized location',
    user: 'David Kim',
    timestamp: '2 days ago',
    ipAddress: '203.0.113.195',
  },
  {
    id: 'log-5',
    type: 'system',
    message: 'Integration GitHub Actions refreshed and API keys updated',
    user: 'System Bot',
    timestamp: '3 days ago',
  },
];

export default function WorkspaceActivityPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { data: workspace, isLoading } = useWorkspace(slug);
  useBranding(workspace?.brandingConfig);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading || !workspace) {
    return (
      <div className="h-screen w-screen flex overflow-hidden bg-background">
        <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId="" />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-8 justify-center items-center">
          <p className="text-sm text-muted-foreground animate-pulse">Loading workspace activity logs...</p>
        </main>
      </div>
    );
  }

  const getLogIcon = (type: AuditEvent['type']) => {
    switch (type) {
      case 'security':
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case 'channel':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'user':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
    }
  };

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
            <span className="text-sm font-semibold text-foreground">Audit & Activity</span>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Activity className="h-8 w-8 text-primary" />
                  Workspace Activity Log
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track user logins, permission updates, channel creations, and administrative actions.
                </p>
              </div>
            </div>

            <Card className="border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Audit Events</CardTitle>
                <CardDescription>
                  This workspace has full enterprise compliance logging enabled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
                  {mockAuditLogs.map(log => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                          {getLogIcon(log.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{log.message}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground/70">{log.user}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {log.timestamp}
                            </span>
                            {log.ipAddress && (
                              <>
                                <span>•</span>
                                <span>IP: {log.ipAddress}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                          {log.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
