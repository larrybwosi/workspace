"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { AssistantChannel } from "@/components/features/assistant/assistant-channel"
import { useState } from "react"

export default function AssistantPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeChannel, setActiveChannel] = useState("assistant")

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <DynamicHeader
          activeView="assistant"
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
        />
        <AssistantChannel />
      </main>
    </div>
  )
}
