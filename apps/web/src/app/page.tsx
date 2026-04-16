"use client"

import { mockUsers } from "@/lib/mock-data"
import { SearchView } from "@/components/layout/search-view"
import { MembersPanel } from "@/components/features/workspace/members-panel"
import { ChannelView } from "@/components/features/chat/channel-view"
import { Sidebar } from "@/components/layout/sidebar"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { InfoPanel } from "@/components/shared/info-panel"
import { WelcomeState } from "@/components/layout/welcome-state"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [activeChannel, setActiveChannel] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const [membersMode, setMembersMode] = useState(false)

  const renderMainContent = () => {
    if (searchMode) {
      return <SearchView onClose={() => setSearchMode(false)} />
    }

    if (membersMode) {
      return <MembersPanel />
    }

    if (activeChannel) {
      return (
        <ChannelView
          channelId={activeChannel}
          type={(activeChannel.includes('-') ? 'channel' : 'dm') as any}
        />
      )
    }

    return <WelcomeState />
  }

  const shouldShowInfoPanel = !!activeChannel && activeChannel !== "assistant"

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={activeChannel}
        onChannelSelect={(id) => {
          // Check if it's a UUID (typical for DM IDs) vs a slug or special ID
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

          if (!isUUID || id === 'assistant' || id === 'notifications' || id === 'friends') {
            setActiveChannel(id)
          } else {
             // It's a DM ID (UUID)
             router.push(`/dm/${id}`)
          }
        }}
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
          id={activeChannel}
          type={(activeChannel.includes('-') ? 'channel' : 'dm') as any}
        />
      )}
    </div>
  )
}
