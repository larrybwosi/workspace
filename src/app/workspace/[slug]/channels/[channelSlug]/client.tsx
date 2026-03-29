"use client";

import { ChannelView } from "@/components/features/chat/channel-view";
import { DynamicHeader } from "@/components/layout/dynamic-header";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { InfoPanel } from "@/components/shared/info-panel";
import { useWorkspaces } from "@/hooks/api/use-workspaces";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useWorkspaceChannels } from "@/hooks/api/use-workspaces";

export default function WorkspaceChannelPageClient({channelSlug}: {channelSlug: string}) {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { slug } = useParams();
  const { data: workspaces } = useWorkspaces();
  const workspace = workspaces?.find((w: any) => w.slug === slug);
  const { data: channels } = useWorkspaceChannels(workspace?.id);
  const channel = channels?.find((c: any) => c.slug === channelSlug || c.id === channelSlug);
  const channelId = channel?.id || channelSlug;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentWorkspaceId={workspace?.id}
      />
      <div className="flex flex-col flex-1 min-w-0 bg-background overflow-hidden">
        <DynamicHeader
            activeView={channelId}
            onMenuClick={() => setSidebarOpen(true)}
            onSearchClick={() => {}}
            onInfoClick={() => setInfoPanelOpen((prev) => !prev)}
        />

        <div className="flex flex-1 overflow-hidden relative">
            <main className="flex-1 flex flex-col min-w-0 bg-background h-full">
            <ChannelView channelId={channelId} workspaceId={workspace?.id} />
            </main>

            {/* 4. Info Panel: Rendered side-by-side */}
            {infoPanelOpen && (
            <aside className="w-[350px] shrink-0 border-l border-border bg-background h-full transition-all duration-300 ease-in-out">
                <InfoPanel
                isOpen={infoPanelOpen}
                onClose={() => setInfoPanelOpen(false)}
                />
            </aside>
            )}
        </div>
      </div>
    </div>
  );
}
