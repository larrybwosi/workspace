"use client";

import { ThreadView } from "@/components/features/chat/thread-view";
import { DynamicHeader } from "@/components/layout/dynamic-header";
import { InfoPanel } from "@/components/shared/info-panel";
import { useState } from "react";

export default function WorkspaceChannelPageClient({channelId}: {channelId: string}) {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      <DynamicHeader
        activeView={channelId}
        onMenuClick={() => {}}
        onSearchClick={() => {}}
        onInfoClick={() => setInfoPanelOpen((prev) => !prev)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 flex flex-col min-w-0 bg-background h-full">
          <ThreadView channelId={channelId} />
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
  );
}
