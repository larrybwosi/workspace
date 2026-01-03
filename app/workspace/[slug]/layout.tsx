import { WorkspaceSidebar } from "@/components/features/workspace/workspace-sidebar"
import type { ReactNode } from "react"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-[280px] shrink-0 hidden md:block border-r h-full">
        <WorkspaceSidebar workspaceSlug={slug} />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}