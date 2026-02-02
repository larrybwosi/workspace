"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useCreateInvitation } from "@/hooks/api/use-invitations"
import { Loader2, Mail, UserPlus } from 'lucide-react'

interface ProjectInvitationDialogProps {
  projectId: string
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectInvitationDialog({ projectId, projectName, open, onOpenChange }: ProjectInvitationDialogProps) {
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("member")
  const createInvitationMutation = useCreateInvitation()

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    try {
      await createInvitationMutation.mutateAsync({
        email,
        role,
        projectId,
      })
      
      toast.success(`Invitation sent to ${email}`)
      setEmail("")
      setRole("member")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send invitation")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite to {projectName}
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join this project. They'll receive an email with instructions to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                disabled={createInvitationMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={createInvitationMutation.isPending}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin - Full access</SelectItem>
                <SelectItem value="member">Member - Standard access</SelectItem>
                <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                <SelectItem value="guest">Guest - Limited access</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "admin" && "Can manage project settings, members, and all resources"}
              {role === "member" && "Can create and edit tasks, add comments, and collaborate"}
              {role === "viewer" && "Can view project content but cannot make changes"}
              {role === "guest" && "Temporary access with specific permissions"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createInvitationMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={createInvitationMutation.isPending}>
            {createInvitationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
