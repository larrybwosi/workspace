import { useState, useEffect } from "react";
import {
  ChannelView,
  WorkspaceSidebar,
  DynamicHeader,
  InfoPanel,
} from "@repo/ui";
import { useWorkspaceChannels } from "@repo/api-client";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspacesWithOffline } from "../hooks/offline/use-workspaces-offline";

export function ChatPage() {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { slug: workspaceSlug, channelSlug } = useParams();

  const { data: workspaces, isOffline } = useWorkspacesWithOffline();
  const workspace = workspaces?.find((w: any) => w.slug === workspaceSlug);

  const { data: channels } = useWorkspaceChannels(workspace?.id);
  const channel = channels?.find((c: any) => c.slug === channelSlug || c.id === channelSlug);
  const channelId = channel?.id || channelSlug;

  // Handle redirect to first workspace if none selected
  useEffect(() => {
    if (!workspaceSlug && workspaces && workspaces.length > 0) {
      navigate(`/workspace/${workspaces[0].slug}`);
    }
  }, [workspaceSlug, workspaces, navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/*
          Warning: WorkspaceSidebar and other UI components use 'next/navigation'
          which might not work correctly in a react-router environment without shims.
      */}
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
            {channelId ? (
                <ChannelView channelId={channelId} workspaceId={workspace?.id} />
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a channel to start chatting
                </div>
            )}
            </main>

            <InfoPanel
                isOpen={infoPanelOpen}
                onClose={() => setInfoPanelOpen(false)}
                id={channelId}
                type="channel"
            />
        </div>
      </div>
    </div>
  );
}
