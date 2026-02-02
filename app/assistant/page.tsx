"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { AssistantChannel } from "@/components/features/assistant/assistant-channel"

export default function AssistantPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const handleChannelSelect = (channelId: string) => {
    if (channelId === "assistant") {
      // Already on assistant page
      return
    } else if (channelId.startsWith("project-")) {
      router.push(`/projects/${channelId}`)
    } else {
      router.push(`/channels/${channelId}`)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel="assistant"
        onChannelSelect={handleChannelSelect}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <DynamicHeader activeView="assistant" onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />

        <AssistantChannel />
      </main>
    </div>
  )
}
