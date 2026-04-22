import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar, DynamicHeader, AssistantChannel } from '@repo/ui';

export function AssistantPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleChannelSelect = (id: string) => {
    if (id === 'assistant') return;
    if (id === 'friends') {
      navigate('/friends');
    } else if (id === 'notifications') {
      navigate('/notifications');
    } else {
      // For DMs (UUID) or other channels
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        navigate(`/dm/${id}`);
      } else {
        navigate(`/workspace/default/channels/${id}`);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel="assistant"
        onChannelSelect={handleChannelSelect}
      />

      <div className="flex flex-col flex-1 min-w-0 bg-background overflow-hidden">
        <DynamicHeader activeView="assistant" onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />

        <main className="flex-1 flex flex-col min-w-0 bg-background h-full">
          <AssistantChannel />
        </main>
      </div>
    </div>
  );
}
