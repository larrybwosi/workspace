"use client"

import { useState } from "react"
import { UserPlus, Search, Filter, MoreHorizontal, Crown, Mail, X, Shield, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  useWorkspaceMembers,
  useInviteToWorkspace,
  useUpdateWorkspaceMember,
  useRemoveWorkspaceMember,
} from "@/hooks/api/use-workspaces"

interface MembersTabProps {
  workspaceId: string
}

export function MembersTab({ workspaceId }: MembersTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")

  const { data, isLoading } = useWorkspaceMembers(workspaceId)
  const inviteMutation = useInviteToWorkspace()
  const updateMemberMutation = useUpdateWorkspaceMember(workspaceId)
  const removeMemberMutation = useRemoveWorkspaceMember(workspaceId)

  const members = data?.members || []

  const handleInvite = async () => {
    try {
      await inviteMutation.mutateAsync({
        workspaceId,
        email: inviteEmail,
        role: inviteRole,
      })
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("member")
    } catch (error) {
      toast.error("Failed to send invitation")
    }
  }

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await updateMemberMutation.mutateAsync({ memberId, role: newRole })
      toast.success("Member role updated")
    } catch (error) {
      toast.error("Failed to update member role")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      await removeMemberMutation.mutateAsync(memberId)
      toast.success("Member removed from workspace")
    } catch (error) {
      toast.error("Failed to remove member")
    }
  }

  const filteredMembers = members.filter(
    (m: any) =>
      m.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading members...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">Manage who has access to this workspace</p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Members
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Members ({members.length})</CardTitle>
              <CardDescription>Workspace members and their roles</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{member.user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.user.name || "Unknown"}
                          {member.role === "owner" && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.role === "owner" ? "default" : member.role === "admin" ? "secondary" : "outline"}
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.user.status === "online" ? "default" : "outline"}
                      className={member.user.status === "online" ? "bg-green-500" : ""}
                    >
                      {member.user.status || "offline"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.user.lastActiveAt ? new Date(member.user.lastActiveAt).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        {member.role !== "owner" && (
                          <>
                            <DropdownMenuItem
                              onSelect={() => {
                                const newRole = prompt("Enter new role (admin, member, guest):")
                                if (newRole && ["admin", "member", "guest"].includes(newRole)) {
                                  handleChangeRole(member.id, newRole)
                                }
                              }}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => handleRemoveMember(member.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove from Workspace
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>Send invitations to new members to join this workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member - Can view and edit</SelectItem>
                  <SelectItem value="admin">Admin - Full access except billing</SelectItem>
                  <SelectItem value="guest">Guest - Limited access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || inviteMutation.isPending}>
              <Mail className="h-4 w-4 mr-2" />
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
