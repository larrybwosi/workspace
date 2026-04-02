"use client"

import * as React from "react"
import { Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { ChannelView } from "@/components/features/chat/channel-view"
import { InfoPanel } from "@/components/shared/info-panel"
import { useUser } from "@/hooks/api/use-users"

export default function DMPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = React.useState(false)

  // Find the user for this DM
  const { data: dmUser, isLoading } = useUser(userId)
  const channelId = `dm-${userId}`

  const handleChannelSelect = (newChannelId: string) => {
    if (newChannelId === "assistant") {
      router.push("/assistant")
    } else if (newChannelId.startsWith("project-")) {
      router.push(`/projects/${newChannelId}`)
    } else if (newChannelId.startsWith("dm-")) {
      const dmUserId = newChannelId.replace("dm-", "")
      router.push(`/dm/${dmUserId}`)
    } else {
      router.push(`/channels/${newChannelId}`)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!dmUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">The user you're trying to message doesn't exist.</p>
          <Button onClick={() => router.push("/channels/general")}>Go to General Channel</Button>
        </div>
      </div>
    )
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
        <DynamicHeader activeView={channelId} onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />

        <ChannelView
          channelId={channelId}
        />

        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 lg:hidden h-12 w-12 rounded-full shadow-lg"
          onClick={() => setInfoPanelOpen(true)}
        >
          <Info className="h-5 w-5" />
        </Button>
      </main>

      <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} dmUser={dmUser} />
    </div>
  )
}
