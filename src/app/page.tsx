"use client"

import { mockUsers } from "@/lib/mock-data"
import { SearchView } from "@/components/layout/search-view"
import { MembersPanel } from "@/components/features/workspace/members-panel"
import { ChannelView } from "@/components/features/chat/channel-view"
import { Sidebar } from "@/components/layout/sidebar"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { InfoPanel } from "@/components/shared/info-panel"
import { useState } from "react"

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [activeChannel, setActiveChannel] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const [membersMode, setMembersMode] = useState(false)

  const getDMUser = () => {
    if (activeChannel?.startsWith("dm-")) {
      const userId = activeChannel?.replace("dm-", "")
      return mockUsers.find((u) => u.id === userId)
    }
    return null
  }

  const renderMainContent = () => {
    if (searchMode) {
      return <SearchView onClose={() => setSearchMode(false)} />
    }

    if (membersMode) {
      return <MembersPanel />
    }

    if (activeChannel?.startsWith("dm-")) {
      return (
        <ChannelView channelId={activeChannel} />
      )
    }

    return <ChannelView channelId={activeChannel || "general"} />
  }

  const shouldShowInfoPanel = activeChannel !== "assistant"

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
        onMembersClick={() => {
          setMembersMode(true)
          setSearchMode(false)
          setSidebarOpen(false)
        }}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <DynamicHeader
          activeView={activeChannel}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {
            setSearchMode(true)
            setMembersMode(false)
          }}
          onInfoClick={() => setInfoPanelOpen(!infoPanelOpen)}
        />

        {renderMainContent()}

      </main>
      {shouldShowInfoPanel && (
        <InfoPanel
          isOpen={infoPanelOpen}
          onClose={() => setInfoPanelOpen(false)}
          dmUser={getDMUser() as any}
        />
      )}
    </div>
  )
}
