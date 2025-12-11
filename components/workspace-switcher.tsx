"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Settings, Users, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { useWorkspaces } from "@/hooks/api/use-workspaces"
import { CreateWorkspaceDialog } from "./create-workspace-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string
  onWorkspaceChange?: (workspaceId: string) => void
}

export function WorkspaceSwitcher({ currentWorkspaceId, onWorkspaceChange }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const { data: workspaces, isLoading } = useWorkspaces()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  const currentWorkspace = workspaces?.find((w: any) => w.id === currentWorkspaceId)

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces?.find((w: any) => w.id === workspaceId)
    if (workspace) {
      router.push(`/workspace/${workspace.slug}`)
    }
    onWorkspaceChange?.(workspaceId)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-14 px-3 hover:bg-muted/80">
            <div className="flex items-center gap-3 min-w-0">
              {currentWorkspace?.icon ? (
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg shrink-0 shadow-sm">
                  {currentWorkspace.icon}
                </div>
              ) : (
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-white font-bold text-sm">{currentWorkspace?.name?.charAt(0) || "W"}</span>
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="font-semibold text-sm truncate flex items-center gap-2">
                  {currentWorkspace?.name || "Select Workspace"}
                  {currentWorkspace?.plan === "pro" && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      PRO
                    </Badge>
                  )}
                  {currentWorkspace?.plan === "enterprise" && (
                    <Badge className="text-[10px] px-1 py-0 bg-gradient-to-r from-amber-500 to-orange-500">ENT</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {currentWorkspace?._count?.members || 0} members · {currentWorkspace?._count?.projects || 0} projects
                </div>
              </div>
            </div>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Workspaces</span>
            <Badge variant="outline" className="text-[10px]">
              {workspaces?.length || 0}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isLoading ? (
            <DropdownMenuItem disabled>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading...
              </div>
            </DropdownMenuItem>
          ) : workspaces?.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No workspaces yet</p>
              <p className="text-xs">Create one to get started</p>
            </div>
          ) : (
            <DropdownMenuGroup className="max-h-64 overflow-auto">
              {workspaces?.map((workspace: any) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceChange(workspace.id)}
                  className={cn("cursor-pointer py-2", currentWorkspaceId === workspace.id && "bg-muted")}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {workspace.icon ? (
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-600/20 text-lg">
                        {workspace.icon}
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">{workspace.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate flex items-center gap-1.5">
                        {workspace.name}
                        {workspace.plan === "pro" && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            PRO
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {workspace._count?.members || 0}
                        <span className="mx-1">·</span>
                        {workspace._count?.projects || 0} projects
                      </div>
                    </div>
                    {currentWorkspaceId === workspace.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}

          <DropdownMenuSeparator />

          {currentWorkspace && (
            <>
              <DropdownMenuItem
                onClick={() => router.push(`/workspace/${currentWorkspaceId}/settings`)}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                Workspace Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Users className="h-4 w-4 mr-2" />
                Invite Members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)} className="cursor-pointer text-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create New Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  )
}
