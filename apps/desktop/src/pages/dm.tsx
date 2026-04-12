import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChannelView, Sidebar, DynamicHeader, InfoPanel } from '@repo/ui';
import { useUser } from '@repo/api-client';
import { Loader2, Info } from 'lucide-react';
import { Button } from '@repo/ui';

export function DMPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  const { data: dmUser, isLoading } = useUser(userId || '');
  const channelId = `dm-${userId}`;

  const handleChannelSelect = (id: string) => {
    if (id === 'assistant') {
      navigate('/assistant');
    } else if (id === 'friends') {
      navigate('/friends');
    } else if (id.startsWith('dm-')) {
      navigate(`/dm/${id.replace('dm-', '')}`);
    } else {
      // For general workspace channels from global sidebar
      navigate(`/workspace/default/channels/${id}`);
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
          onSearchClick={() => {}}
          onInfoClick={() => setInfoPanelOpen(prev => !prev)}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 flex flex-col min-w-0 bg-background h-full">
            <ChannelView channelId={channelId} />
          </main>

          <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} dmUser={dmUser} />
        </div>
      </div>
    </div>
  );
}
