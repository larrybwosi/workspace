"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWorkspaces } from "@/hooks/api/use-workspaces"
import { CreateWorkspaceDialog } from "./create-workspace-dialog"

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string
  onWorkspaceChange?: (workspaceId: string) => void
}

export function WorkspaceSwitcher({ currentWorkspaceId, onWorkspaceChange }: WorkspaceSwitcherProps) {
  const { data: workspaces, isLoading } = useWorkspaces()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  const currentWorkspace = workspaces?.find((w: any) => w.id === currentWorkspaceId)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-12 px-3">
            <div className="flex items-center gap-2 min-w-0">
              {currentWorkspace?.icon ? (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg shrink-0">
                  {currentWorkspace.icon}
                </div>
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{currentWorkspace?.name?.charAt(0) || "W"}</span>
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="font-semibold text-sm truncate">{currentWorkspace?.name || "Select Workspace"}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {currentWorkspace?._count?.members || 0} members
                </div>
              </div>
            </div>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading ? (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          ) : workspaces?.length === 0 ? (
            <DropdownMenuItem disabled>No workspaces</DropdownMenuItem>
          ) : (
            workspaces?.map((workspace: any) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => onWorkspaceChange?.(workspace.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1">
                  {workspace.icon ? (
                    <div className="h-6 w-6 rounded flex items-center justify-center bg-primary/10">
                      {workspace.icon}
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{workspace.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{workspace.name}</div>
                    <div className="text-xs text-muted-foreground">{workspace._count?.projects || 0} projects</div>
                  </div>
                  {currentWorkspaceId === workspace.id && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  )
}
