"use client"
import { Menu, Search, MoreVertical, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { mockChannels, mockProjects } from "@/lib/mock-data"

interface DynamicHeaderProps {
  activeView: string
  onMenuClick: () => void
  onSearchClick: () => void
  onBackClick?: () => void
}

export function DynamicHeader({ activeView, onMenuClick, onSearchClick, onBackClick }: DynamicHeaderProps) {
  const getBreadcrumb = () => {
    if (activeView.startsWith("task-")) {
      const project = mockProjects.find((p) => p.tasks.some((t) => `task-${t.id}` === activeView))
      const task = project?.tasks.find((t) => `task-${t.id}` === activeView)
      return (
        <>
          <span className="text-muted-foreground">Projects</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-muted-foreground">{project?.name}</span>
          <span className="text-muted-foreground">›</span>
          <span className="font-semibold">{task?.title}</span>
        </>
      )
    }

    if (activeView.startsWith("project-")) {
      const project = mockProjects.find((p) => p.id === activeView)
      return (
        <>
          <span className="text-muted-foreground">Team spaces</span>
          <span className="text-muted-foreground">›</span>
          <span className="font-semibold">{project?.name}</span>
        </>
      )
    }

    if (activeView.startsWith("dm-")) {
      return (
        <>
          <span className="text-muted-foreground">Direct Messages</span>
          <span className="text-muted-foreground">›</span>
          <span className="font-semibold">Conversation</span>
        </>
      )
    }

    // Channel view
    const findChannel = (channels: any[], id: string): any => {
      for (const channel of channels) {
        if (channel.id === id) return channel
        if (channel.children) {
          const found = findChannel(channel.children, id)
          if (found) return found
        }
      }
      return null
    }

    const channel = findChannel(mockChannels, activeView)
    if (channel) {
      return (
        <>
          <span className="text-sm text-muted-foreground">#</span>
          <span className="font-semibold">{channel.name}</span>
        </>
      )
    }

    return <span className="font-semibold">Dealio</span>
  }

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>
        {onBackClick && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBackClick}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2 text-sm">{getBreadcrumb()}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search..." className="pl-8 w-64 h-8 cursor-pointer" onClick={onSearchClick} readOnly />
        </div>
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onSearchClick}>
          <Search className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
