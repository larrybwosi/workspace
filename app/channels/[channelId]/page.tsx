"use client"

import * as React from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { InfoPanel } from "@/components/info-panel"
import { ThreadView } from "@/components/thread-view"
import { DynamicHeader } from "@/components/dynamic-header"
import { AssistantChannel } from "@/components/assistant-channel"
import { mockChannels, mockUsers } from "@/lib/mock-data"
import { useParams, useRouter } from "next/navigation"

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const channelId = params.channelId as string

  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = React.useState(false)
  const [searchMode, setSearchMode] = React.useState(false)

  // Find channel or DM user
  const getDMUser = () => {
    if (channelId.startsWith("dm-")) {
      const userId = channelId.replace("dm-", "")
      return mockUsers.find((u) => u.id === userId)
    }
    return null
  }

  const findChannel = (channels: typeof mockChannels, id: string): any => {
    for (const channel of channels) {
      if (channel.id === id) return channel
      if (channel.children) {
        const found = findChannel(channel.children, id)
        if (found) return found
      }
    }
    return null
  }

  const channel = findChannel(mockChannels, channelId)
  const dmUser = getDMUser()

  const handleChannelSelect = (newChannelId: string) => {
    if (newChannelId === "assistant") {
      router.push("/assistant")
    } else if (newChannelId.startsWith("project-")) {
      router.push(`/projects/${newChannelId}`)
    } else if (newChannelId.startsWith("dm-") || mockChannels.some((c) => c.id === newChannelId)) {
      router.push(`/channels/${newChannelId}`)
    }
  }

  const renderContent = () => {
    if (channelId === "assistant") {
      return <AssistantChannel />
    }

    if (channelId.startsWith("dm-")) {
      return (
        <ThreadView
          thread={{
            id: channelId,
            title: dmUser?.name || "Direct Message",
            channelId: channelId,
            messages: [],
            creator: mockUsers[0].id,
            dateCreated: new Date(),
            status: "Active",
            tags: [],
            tasks: 0,
            linkedThreads: [],
            members: [mockUsers[0].id, dmUser?.id || ""],
          }}
          channelId={channelId}
        />
      )
    }

    // Regular channel
    return <ThreadView channelId={channelId} />
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={channelId}
        onChannelSelect={handleChannelSelect}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <DynamicHeader
          activeView={channelId}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setSearchMode(true)}
        />

        {renderContent()}

        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 lg:hidden h-12 w-12 rounded-full shadow-lg"
          onClick={() => setInfoPanelOpen(true)}
        >
          <Info className="h-5 w-5" />
        </Button>
      </main>

      <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} />
    </div>
  )
}
