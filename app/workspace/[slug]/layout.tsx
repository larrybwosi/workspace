import { WorkspaceSidebar } from "@/components/features/workspace/workspace-sidebar"
import type { ReactNode } from "react"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  // Await params (Required in Next.js 15+)
  const { slug } = await params

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* We wrap the Sidebar in a fixed width container (aside).
        This is necessary because the Sidebar component uses 'w-full', 
        so without this wrapper, it would try to take up half the screen.
      */}
      <aside className="w-[280px] shrink-0 hidden md:block border-r h-full">
        <WorkspaceSidebar workspaceSlug={slug} />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}