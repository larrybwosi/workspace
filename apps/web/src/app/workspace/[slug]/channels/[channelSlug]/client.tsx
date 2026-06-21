'use client';

import { ChannelView } from '@/components/features/chat/channel-view';
import { ThreadPanel } from '@/components/features/chat/thread-panel';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { InfoPanel } from '@/components/shared/info-panel';
import { useWorkspace } from '@repo/api-client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Message } from '@repo/types';

import { useWorkspaceChannels } from '@repo/api-client';

export default function WorkspaceChannelPageClient({ channelSlug }: { channelSlug: string }) {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [threadPanelOpen, setThreadPanelOpen] = useState(false);
  const [selectedThreadParent, setSelectedThreadParent] = useState<Message | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { slug } = useParams();
  const workspaceSlug = slug as string;

  const { data: channels } = useWorkspaceChannels(workspaceSlug);

  const channel = channels?.find((c: any) => c.slug === channelSlug || c.id === channelSlug);
  const channelId = channel?.id || channelSlug;

  const handleOpenThread = (message: Message) => {
    setSelectedThreadParent(message);
    setThreadPanelOpen(true);
    setInfoPanelOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={workspaceSlug} />
      <div className="flex flex-col flex-1 min-w-0 bg-background overflow-hidden">
        <DynamicHeader
          activeView={channelId}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
          onInfoClick={() => {
            setInfoPanelOpen(prev => !prev);
            setThreadPanelOpen(false);
          }}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 flex flex-col min-w-0 bg-background h-full">
            <ChannelView channelId={channelId} workspaceId={workspaceSlug} onThreadOpen={handleOpenThread} />
          </main>

          {/* Side Panels */}
          <ThreadPanel
            isOpen={threadPanelOpen}
            onClose={() => setThreadPanelOpen(false)}
            channelId={channelId}
            workspaceId={workspaceSlug}
            parentMessage={selectedThreadParent}
          />

          <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} id={channelId} type="channel" />
        </div>
      </div>
    </div>
  );
}
