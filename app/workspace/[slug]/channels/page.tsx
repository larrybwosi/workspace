"use client"

import * as React from "react"
import { use } from "react"
import { Hash, Lock, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChannelsPageProps {
  params: Promise<{ slug: string }>
}

export default function ChannelsPage({ params }: ChannelsPageProps) {
  const { slug } = use(params)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const [channels] = React.useState([
    { id: "ch-1", name: "general", type: "public", members: 142, description: "General workspace discussions" },
    { id: "ch-2", name: "announcements", type: "public", members: 142, description: "Important announcements" },
    { id: "ch-3", name: "engineering-general", type: "public", members: 45, description: "Engineering team channel" },
    { id: "ch-4", name: "design-reviews", type: "private", members: 12, description: "Design review sessions" },
    { id: "ch-5", name: "sales-leads", type: "private", members: 32, description: "Sales lead discussions" },
  ])

  const filteredChannels = channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
              <h1 className="text-2xl font-bold">Channels</h1>
              <p className="text-sm text-muted-foreground">Manage workspace communication channels</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Channel
          </Button>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-3">
              {filteredChannels.map((channel) => (
                <Card key={channel.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {channel.type === "public" ? (
                        <Hash className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                      </div>
                      <Badge variant="secondary">{channel.members} members</Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
