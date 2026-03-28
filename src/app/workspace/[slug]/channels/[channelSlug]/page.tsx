import type { Metadata } from "next"
import WorkspaceChannelPageClient from "./client"

export const metadata: Metadata = {
  title: "Channel Details",
  description: "View and manage channel details",
}

export default async function WorkspaceChannelPage( {params}: {params: Promise<{channelSlug: string}>} ) {
  const { channelSlug } = await params;
  return (
    <div className="flex-1 h-full flex-col"> 
      <WorkspaceChannelPageClient channelSlug={channelSlug} />
    </div>
  )
}
