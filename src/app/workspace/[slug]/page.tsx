"use client"

import { useParams } from "next/navigation"
import { useWorkspaces } from "@/hooks/api/use-workspaces"
import { Sidebar } from "@/components/layout/sidebar"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, MessageSquare, Settings, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"

export default function WorkspacePage() {
  const { slug } = useParams()
  const { data: workspaces, isLoading } = useWorkspaces()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const workspace = workspaces?.find((w: any) => w.slug === slug)

  if (isLoading) {
    return (
      <div className="h-screen flex overflow-hidden bg-background">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeChannel=""
          onChannelSelect={() => {}}
        />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <DynamicHeader
            activeView="Loading..."
            onMenuClick={() => setSidebarOpen(true)}
          />
          <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-72" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Workspace not found</h1>
          <p className="text-muted-foreground">The workspace you are looking for does not exist.</p>
          <Button asChild className="mt-4">
            <Link href="/">Go Back Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel=""
        onChannelSelect={() => {}}
        currentWorkspaceId={workspace.id}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <DynamicHeader
          activeView="Workspace Dashboard"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl shadow-lg shrink-0">
              {workspace.icon || workspace.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{workspace.name}</h1>
              <p className="text-muted-foreground text-lg">{workspace.description || "Welcome to your workspace!"}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workspace.members?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total workspace members</p>
                <Button variant="ghost" className="w-full mt-4 justify-between" asChild>
                    <Link href={`/workspace/${slug}/members`}>
                        View Members
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Channels</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workspace._count?.channels || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active communication channels</p>
                <Button variant="ghost" className="w-full mt-4 justify-between" asChild>
                    <Link href={`/workspace/${slug}/channels`}>
                        Browse Channels
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Settings</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Configure</div>
                <p className="text-xs text-muted-foreground mt-1">Workspace preferences</p>
                <Button variant="ghost" className="w-full mt-4 justify-between" asChild>
                    <Link href={`/workspace/${slug}/settings`}>
                        Open Settings
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Everything you need to set up your workspace</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-start gap-4 p-4 bg-background rounded-xl border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">1</div>
                <div>
                    <h3 className="font-semibold">Invite your team</h3>
                    <p className="text-sm text-muted-foreground">Add colleagues to start collaborating on projects together.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-background rounded-xl border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">2</div>
                <div>
                    <h3 className="font-semibold">Create channels</h3>
                    <p className="text-sm text-muted-foreground">Organize discussions by topic, project, or department.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-background rounded-xl border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">3</div>
                <div>
                    <h3 className="font-semibold">Explore integrations</h3>
                    <p className="text-sm text-muted-foreground">Connect your favorite tools to streamline your workflow.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
