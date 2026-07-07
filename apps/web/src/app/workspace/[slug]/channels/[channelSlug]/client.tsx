'use client';

import { ChannelView } from '@/components/features/chat/channel-view';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { InfoPanel } from '@/components/shared/info-panel';
import { useWorkspaceChannels } from '@repo/api-client';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function WorkspaceChannelPageClient({ channelSlug }: { channelSlug: string }) {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { slug } = useParams();
  const workspaceSlug = slug as string;
  const { data: channels } = useWorkspaceChannels(workspaceSlug);

  // Resolve the real channel UUID from the slug
  const channel = channels?.find((c: any) => c.slug === channelSlug || c.id === channelSlug);
  const channelId = channel?.id || channelSlug;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={workspaceSlug} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* REMOVED 'relative' here so the InfoPanel behaves as a flex sibling rather than an overlay */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ChannelView
              channelId={channelId}
              workspaceId={workspaceSlug}
              onToggleInfo={() => setInfoPanelOpen(prev => !prev)}
            />
          </main>

          <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} id={channelId} type="channel" />
        </div>
      </div>
    </div>
  );
}
