"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Users, Search, Filter, UserPlus, Mail, MoreHorizontal, Trash2, Shield, Crown, User, Menu } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { InfoPanel } from "@/components/shared/info-panel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  useWorkspaces,
  useWorkspaceMembers,
  useInviteToWorkspace,
  useUpdateWorkspaceMember,
  useRemoveWorkspaceMember,
  useWorkspaceInviteLinks,
  useCreateWorkspaceInviteLink,
} from "@repo/api-client"
import { useToast } from "@/hooks/use-toast"
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar"
import { DynamicHeader } from "@/components/layout/dynamic-header"

interface MembersPageProps {
  params: Promise<{ slug: string }>
}

export default function MembersPage({ params }: MembersPageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [inviteRole, setInviteRole] = React.useState("member")
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [generatedLink, setGeneratedLink] = React.useState("")
  const [infoPanelOpen, setInfoPanelOpen] = React.useState(false)

  // Fetch members
  const { data: membersData, isLoading } = useWorkspaceMembers(slug)
  const { data: inviteLinks } = useWorkspaceInviteLinks(slug)
  const createInviteLinkMutation = useCreateWorkspaceInviteLink(slug)
  const updateMutation = useUpdateWorkspaceMember(slug)
  const removeMutation = useRemoveWorkspaceMember(slug)

  const members = Array.isArray(membersData) ? membersData : []

  // Filter members
  const filteredMembers = members.filter((member: any) => {
    const matchesSearch =
      member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleGenerateLink = async () => {
    try {
      const link = await createInviteLinkMutation.mutateAsync({
        ["workspaceId" as any]: workspaceId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      const fullUrl = `${window.location.origin}/invite/${link.code}`
      setGeneratedLink(fullUrl)
      toast({
        title: "Invite link generated",
        description: "You can now share this link with others",
      })
    } catch (error) {
      toast({
        title: "Failed to generate link",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Link has been copied to your clipboard",
    })
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await updateMutation.mutateAsync({ memberId, role: newRole })
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Failed to update role",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      await removeMutation.mutateAsync(memberId)
      toast({
        title: "Member removed",
        description: "The member has been removed from the workspace",
      })
    } catch (error) {
      toast({
        title: "Failed to remove member",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentWorkspaceId={slug}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DynamicHeader
          activeView="Members"
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
          onInfoClick={() => setInfoPanelOpen((prev) => !prev)}
        />
        <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Members</h1>
            <p className="text-muted-foreground">Manage workspace team members</p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Members</DialogTitle>
                <DialogDescription>Generate a unique link to join this workspace</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {generatedLink ? (
                  <div className="space-y-2">
                    <Label>Invite Link</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={generatedLink} className="flex-1" />
                      <Button variant="secondary" onClick={() => copyToClipboard(generatedLink)}>Copy</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This link will expire in 7 days.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Invite links allow anyone with the link to join your workspace.
                      The link will be associated with you so we know who invited the new member.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="role">Default Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setInviteOpen(false);
                  setGeneratedLink("");
                }}>
                  Close
                </Button>
                {!generatedLink && (
                  <Button onClick={handleGenerateLink} disabled={createInviteLinkMutation.isPending}>
                    {createInviteLinkMutation.isPending ? "Generating..." : "Generate Link"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members List */}
      <div className="p-6">
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Loading members...</CardContent>
            </Card>
          ) : filteredMembers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No members found</p>
              </CardContent>
            </Card>
          ) : (
            filteredMembers.map((member: any) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={member.user?.image || "/placeholder.svg"} />
                      <AvatarFallback className="text-lg">
                        {member.user?.name?.slice(0, 2)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{member.user?.name || "Unknown User"}</h3>
                        {getRoleIcon(member.role)}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {member.user?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge>{member.role}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "admin")}>
                          <Shield className="h-4 w-4 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "member")}>
                          <User className="h-4 w-4 mr-2" />
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRemove(member.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
        </div>
        <InfoPanel
            isOpen={infoPanelOpen}
            onClose={() => setInfoPanelOpen(false)}
            type="workspace"
            id={slug}
        />
        </div>
      </main>
    </div>
  )
}
