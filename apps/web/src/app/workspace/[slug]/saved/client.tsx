'use client';

import { DynamicHeader } from '@/components/layout/dynamic-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Bookmark, MessageSquare } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { MessageItem } from '@repo/ui/features/chat/message-item';

export default function SavedItemsPageClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { slug } = useParams();
  const workspaceSlug = slug as string;

  // Mock saved items - in a real app, this would come from an API
  const savedItems = [
    {
      id: 'saved-1',
      message: {
        id: 'msg-1',
        content: 'Important meeting notes from today.',
        userId: 'user-1',
        timestamp: new Date().toISOString(),
        reactions: [],
        user: { name: 'Alice Smith', avatar: '' }
      },
      savedAt: new Date().toISOString()
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={workspaceSlug} />
      <div className="flex flex-col flex-1 min-w-0 bg-background overflow-hidden">
        <DynamicHeader
          activeView="Saved Items"
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
        />

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Saved Items</h1>
              <p className="text-sm text-muted-foreground">Messages you've bookmarked for later.</p>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {savedItems.length > 0 ? (
                savedItems.map((item) => (
                  <div key={item.id} className="group relative border border-border rounded-xl bg-card overflow-hidden">
                    <div className="p-2 border-b border-border bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <MessageSquare className="h-3 w-3" />
                        Saved from #general
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                        Remove
                      </Button>
                    </div>
                    <div className="p-2">
                      <MessageItem message={item.message} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Bookmark className="h-8 w-8 text-muted-foreground opacity-20" />
                  </div>
                  <h3 className="text-lg font-semibold">No saved items yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Save messages, files, or threads to keep track of important information.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
