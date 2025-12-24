import type { Metadata } from "next"
import WorkspaceChannelPageClient from "./client"

export const metadata: Metadata = {
  title: "Channel Details",
  description: "View and manage channel details",
}

export default function WorkspaceChannelPage() {
  return( <div className="flex-1 h-screen flex-col">
    <WorkspaceChannelPageClient />
  </div>)
}
