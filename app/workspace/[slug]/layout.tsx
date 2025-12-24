"use client"

import type { ReactNode } from "react"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { slug: string }
}) {
  const { slug } = await params
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSidebar workspaceSlug={slug} />

      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  )
}
