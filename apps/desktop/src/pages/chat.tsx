import { useState, useEffect } from 'react';
import { ChannelView, WorkspaceSidebar, InfoPanel } from '@repo/ui';
import { useWorkspaceChannels } from '@repo/api-client';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useWorkspacesWithOffline } from '../hooks/offline/use-workspaces-offline';

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
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={workspace?.id} />
      <div className="flex flex-col flex-1 min-w-0 bg-background overflow-hidden">
        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 flex flex-col min-w-0 bg-background h-full">
            {channelId ? (
              <ChannelView
                channelId={channelId}
                workspaceId={workspace?.id}
                onToggleInfo={() => setInfoPanelOpen(!infoPanelOpen)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-dotted">
                <div className="text-center p-8 bg-card border border-border/50 rounded-2xl shadow-xl max-w-sm">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Welcome to your Workspace</h3>
                  <p className="text-sm text-muted-foreground">Select a channel from the sidebar to start collaborating with your team.</p>
                </div>
              </div>
            )}
          </main>

          <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} id={channelId} type="channel" />
        </div>
      </div>
    </div>
  );
}
