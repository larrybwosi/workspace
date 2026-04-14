'use client';

import { ChannelView } from '@/components/features/chat/channel-view';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { InfoPanel } from '@/components/shared/info-panel';
import { useWorkspace, useStartCall } from '@repo/api-client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useCallStore } from '@repo/shared';
import { toast } from 'sonner';

import { useWorkspaceChannels } from '@repo/api-client';

export default function WorkspaceChannelPageClient({ channelSlug }: { channelSlug: string }) {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsTrigger, setSettingsTrigger] = useState(0);
  const { slug } = useParams();
  const workspaceSlug = slug as string;

  const { data: channels } = useWorkspaceChannels(workspaceSlug);

  const channel = channels?.find((c: any) => c.slug === channelSlug || c.id === channelSlug);
  const channelId = channel?.id || channelSlug;

  const { setCall } = useCallStore();
  const startCallMutation = useStartCall();

  const handleStartCall = async (type: 'voice' | 'video') => {
    try {
      const data = await startCallMutation.mutateAsync({
        type,
        workspaceSlug,
        channelId,
      });
      setCall(data);
    } catch (error) {
      toast.error('Failed to start call');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={workspaceSlug} />
      <div className="flex flex-col flex-1 min-w-0 bg-background overflow-hidden">
        <DynamicHeader
          activeView={channelId}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
          onInfoClick={() => setInfoPanelOpen(prev => !prev)}
          onVoiceCallClick={() => handleStartCall('voice')}
          onVideoCallClick={() => handleStartCall('video')}
          onSettingsClick={() => setSettingsTrigger(prev => prev + 1)}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 flex flex-col min-w-0 bg-background h-full">
            <ChannelView
              channelId={channelId}
              workspaceId={workspaceSlug}
              onToggleInfo={() => setInfoPanelOpen(prev => !prev)}
              onOpenSettings={settingsTrigger}
            />
          </main>

          {/* 4. Info Panel: Rendered side-by-side */}
          <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} id={channelId} type="channel" />
        </div>
      </div>
    </div>
  );
}
