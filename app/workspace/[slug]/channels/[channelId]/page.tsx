import type { Metadata } from "next"
import WorkspaceChannelPageClient from "./client"

export const metadata: Metadata = {
  title: "Channel Details",
  description: "View and manage channel details",
}

export default async function WorkspaceChannelPage( {params}: {params: Promise<{channelId: string}>} ) {
  const { channelId } = await params; 
  return (
    <div className="flex-1 h-full flex-col"> 
      <WorkspaceChannelPageClient channelId={channelId} />
    </div>
  )
}
