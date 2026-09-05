'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceSidebar } from '@repo/ui';
import { ChannelView } from '@/components/features/chat/channel-view';
import { InfoPanel } from '@/components/shared/info-panel';
import { useUser } from '@repo/api-client';

export default function DMPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = React.useState(false);

  const { data: dmUser, isLoading } = useUser(userId);
  const channelId = `dm-${userId}`;

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

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Rail + Sidebar */}
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Unified Channel / DM view */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ChannelView
              channelId={channelId}
              onToggleInfo={() => setInfoPanelOpen(v => !v)}
              onToggleSidebar={() => setSidebarOpen(prev => !prev)}
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
