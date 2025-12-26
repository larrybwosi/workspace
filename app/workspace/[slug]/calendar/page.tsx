"use client"

import * as React from "react"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { WorkspaceSidebar } from "@/components/features/workspace/workspace-sidebar"
import { CalendarView } from "@/components/features/calendar/calendar-view"

interface CalendarPageProps {
  params: Promise<{ slug: string }>
}

export default function CalendarPage({ params }: CalendarPageProps) {
  const { slug } = use(params)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar workspaceSlug={slug} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Workspace Calendar</h1>
              <p className="text-sm text-muted-foreground">View and manage workspace events and deadlines</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <CalendarView />
        </div>
      </main>
    </div>
  )
}
