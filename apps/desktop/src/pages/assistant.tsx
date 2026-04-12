import { AssistantChannel } from '@repo/ui/src/features/assistant/assistant-channel';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  DynamicHeader,
} from "@repo/ui";

export function AssistantPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleChannelSelect = (id: string) => {
    if (id === "assistant") return;
    if (id === "friends") {
      navigate("/friends");
    } else if (id.startsWith("dm-")) {
      navigate(`/dm/${id.replace("dm-", "")}`);
    } else {
      navigate(`/workspace/default/channels/${id}`);
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
        <DynamicHeader
            activeView="assistant"
            onMenuClick={() => setSidebarOpen(true)}
            onSearchClick={() => {}}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-background h-full">
            <AssistantChannel />
        </main>
      </div>
    </div>
  );
}
