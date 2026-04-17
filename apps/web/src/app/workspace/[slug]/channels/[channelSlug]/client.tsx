'use client';

import { ChannelView } from '@/components/features/chat/channel-view';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { InfoPanel } from '@/components/shared/info-panel';
import { useWorkspace, useStartCall } from '@repo/api-client';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCallStore, useInfoPanelStore } from '@repo/shared';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

import { useWorkspaceChannels } from '@repo/api-client';

export default function WorkspaceChannelPageClient({ channelSlug }: { channelSlug: string }) {
  const isMobile = useIsMobile();
  const { isManuallyClosed, setManuallyClosed } = useInfoPanelStore();
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [infoPanelTab, setInfoPanelTab] = useState('info');

  useEffect(() => {
    // Default open on desktop, closed on mobile
    // But respect manual close for the session
    if (isMobile !== undefined) {
      if (isMobile) {
        setInfoPanelOpen(false);
      } else {
        setInfoPanelOpen(!isManuallyClosed);
      }
    }
  }, [isMobile]);

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
          onSearchClick={() => {
            setInfoPanelOpen(true);
            setInfoPanelTab('search');
          }}
          onInfoClick={() => {
            const newState = !infoPanelOpen;
            setInfoPanelOpen(newState);
            if (!newState) {
              setManuallyClosed(true);
            } else {
              setManuallyClosed(false);
              setInfoPanelTab('info');
            }
          }}
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
          <InfoPanel
            isOpen={infoPanelOpen}
            onClose={() => {
              setInfoPanelOpen(false);
              setManuallyClosed(true);
            }}
            id={channelId}
            type="channel"
            activeTab={infoPanelTab}
            onTabChange={setInfoPanelTab}
          />
        </div>
      </div>
    </div>
  );
}
