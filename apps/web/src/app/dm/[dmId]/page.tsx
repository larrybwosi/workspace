'use client';

import * as React from 'react';
import { Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { ChannelView } from '@/components/features/chat/channel-view';
import { InfoPanel } from '@/components/shared/info-panel';
import { useDM } from '@repo/api-client';

export default function DMPage() {
  const params = useParams();
  const router = useRouter();
  const dmId = params.dmId as string;

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = React.useState(false);

  // Find the conversation for this DM
  const { data: dmConversation, isLoading } = useDM(dmId);

  const handleChannelSelect = (newChannelId: string) => {
    if (newChannelId === 'assistant') {
      router.push('/assistant');
    } else if (newChannelId.startsWith('project-')) {
      router.push(`/projects/${newChannelId}`);
    } else if (newChannelId.startsWith('dm-')) {
      const targetDmId = newChannelId.replace('dm-', '');
      router.push(`/dm/${targetDmId}`);
    } else {
      router.push(`/workspace/default/channels/${newChannelId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dmConversation) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Conversation not found</h2>
          <p className="text-muted-foreground mb-4">
            The direct message conversation you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={dmId}
        onChannelSelect={handleChannelSelect}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <DynamicHeader
          activeView={dmId}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
          onInfoClick={() => setInfoPanelOpen(prev => !prev)}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <ChannelView channelId={dmId} type="dm" />

          <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} id={dmId} type="dm" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 lg:hidden h-12 w-12 rounded-full shadow-lg"
          onClick={() => setInfoPanelOpen(true)}
        >
          <Info className="h-5 w-5" />
        </Button>
      </main>
    </div>
  );
}
