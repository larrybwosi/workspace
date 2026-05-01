import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChannelView, Sidebar, DynamicHeader } from '@repo/ui';
import { InfoPanel } from '../components/shared/info-panel';
import { useUser, useStartCall } from '@repo/api-client';
import { Loader2 } from 'lucide-react';
import { Button } from '@repo/ui';
import { useSession, useCallStore } from '@repo/shared';
import { toast } from 'sonner';

export function DMPage() {
  const { dmId } = useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { setCall } = useCallStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [infoPanelTab, setInfoPanelTab] = useState('info');

  // For desktop app, we are using the user ID as dmId for now, matching web app's [userId] approach
  const userId = dmId?.startsWith('dm-') ? dmId.replace('dm-', '') : dmId;
  const { data: dmUser, isLoading } = useUser(userId || '');
  const startCallMutation = useStartCall();

  const handleChannelSelect = (id: string) => {
    if (id === 'assistant') {
      navigate('/assistant');
    } else if (id === 'friends') {
      navigate('/friends');
    } else if (id === 'notifications') {
      navigate('/notifications');
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      navigate(`/dm/${id}`);
    } else {
      // Sidebar handles its own routing usually, but for fallback:
      navigate(`/workspace/default/channels/${id}`);
    }
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    try {
      const data = await startCallMutation.mutateAsync({
        type,
        workspaceSlug: 'default', // DM calls are usually global but API requires workspaceSlug or we use 'default'
        recipientId: dmUser?.id,
      });
      setCall(data);
    } catch (error) {
      toast.error('Failed to start call');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dmUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">User not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const channelId = `dm-${userId}`;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={channelId}
        onChannelSelect={handleChannelSelect}
      />

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
            if (newState) setInfoPanelTab('info');
          }}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 flex flex-col min-w-0 bg-background h-full">
            <ChannelView channelId={channelId} />
          </main>

          <InfoPanel
            isOpen={infoPanelOpen}
            onClose={() => setInfoPanelOpen(false)}
            id={channelId}
            dmUser={dmUser ? {
              id: dmUser.id,
              name: dmUser.name,
              avatar: dmUser.avatar || dmUser.image || '',
              role: 'User',
              status: 'online' // Presence is handled inside InfoPanel if needed or just shown
            } : undefined}
            activeTab={infoPanelTab}
            onTabChange={setInfoPanelTab}
          />
        </div>
      </div>
    </div>
  );
}
