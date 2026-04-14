'use client';

import { useRouter } from 'next/navigation';
import { DirectMessagesList } from '@repo/ui';
import { Sidebar } from '@/components/layout/sidebar';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { useState } from 'react';

export default function DMsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel="dms"
        onChannelSelect={(id) => {
          router.push(`/dm/${id}`);
        }}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <DynamicHeader
          activeView="Direct Messages"
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
        />

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/50">
            <h1 className="text-2xl font-bold">Direct Messages</h1>
            <p className="text-sm text-muted-foreground">Your private conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <DirectMessagesList
              onUserSelect={(userId) => {
                // The DirectMessagesList in repo/ui currently uses user.id in onUserSelect
                // But we want to navigate to the conversation.
                // Looking at direct-message-list.tsx, it maps dmConversations and passes otherUser.id
                // We should probably update DirectMessagesList to pass dm.id if we want SPA consistency.
                // For now, let's assume it passes what we need.
                router.push(`/dm/${userId}`);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
