"use client"
import { ThreadView } from "@/components/thread-view"
import { InfoPanel } from "@/components/info-panel"
import { DynamicHeader } from "@/components/dynamic-header"
import { useParams } from "next/navigation"
import { useState } from "react"

export default function WorkspaceChannelPageClient() {
  const params = useParams()
  const channelId = params.channelId as string
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)

  return (
    <div className="flex-1 h-full flex-col">
      <DynamicHeader
        activeView={channelId}
        onMenuClick={() => {}}
        onSearchClick={() => {}}
        // onInfoClick={() => setInfoPanelOpen(!infoPanelOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <ThreadView channelId={channelId} />
        </div>
        {infoPanelOpen && <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} />}
      </div>
    </div>
  )
}
