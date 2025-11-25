"use client"

import { useState } from "react"
import { Building2, Check, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useWorkspaces, useInviteToWorkspace } from "@/hooks/api/use-workspaces"

interface InviteToWorkspaceDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteToWorkspaceDialog({ userId, userName, open, onOpenChange }: InviteToWorkspaceDialogProps) {
  const { toast } = useToast()
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)
  const { data: workspaces, isLoading } = useWorkspaces()
  const inviteMutation = useInviteToWorkspace()

  const handleInvite = async (workspaceId: string, role = "member") => {
    try {
      await inviteMutation.mutateAsync({
        workspaceId,
        userId,
        role,
      })

      toast({
        title: "Invitation sent",
        description: `${userName} has been invited to the workspace`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to Workspace</DialogTitle>
          <DialogDescription>Select a workspace to invite {userName} to</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : workspaces && workspaces.length > 0 ? (
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => setSelectedWorkspace(workspace.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {workspace.icon ? (
                        <span className="text-lg">{workspace.icon}</span>
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{workspace.name}</p>
                      <p className="text-xs text-muted-foreground">{workspace._count.members} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{workspace.plan}</Badge>
                    {selectedWorkspace === workspace.id && (
                      <Button size="sm" onClick={() => handleInvite(workspace.id)} disabled={inviteMutation.isPending}>
                        {inviteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Invite
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No workspaces available</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
