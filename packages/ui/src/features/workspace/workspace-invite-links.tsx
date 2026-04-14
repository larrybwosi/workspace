"use client"

import { useState } from "react"
import { Button } from "../../components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/card"
import { Input } from "../../components/input"
import { Label } from "../../components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/table"
import { Copy, Loader2, Plus, Trash2 } from "lucide-react"
import { useWorkspaceInviteLinks, useCreateWorkspaceInviteLink, useDeleteWorkspaceInviteLink } from "@repo/api-client"
import { useToast } from "../../hooks/use-toast"
import { format } from "date-fns"

interface WorkspaceInviteLinksProps {
  workspaceId: string
}

export function WorkspaceInviteLinks({ workspaceId: workspaceSlug }: WorkspaceInviteLinksProps) {
  const { data: inviteLinks, isLoading } = useWorkspaceInviteLinks(workspaceSlug)
  const createLinkMutation = useCreateWorkspaceInviteLink(workspaceSlug)
  const deleteLinkMutation = useDeleteWorkspaceInviteLink(workspaceSlug)
  const { toast } = useToast()

  const [maxUses, setMaxUses] = useState("0")
  const [expiration, setExpiration] = useState("never")

  const handleCreateLink = async () => {
    try {
      const expiresAt = expiration === "never" ? undefined : new Date(Date.now() + parseInt(expiration) * 24 * 60 * 60 * 1000).toISOString()
      await createLinkMutation.mutateAsync({
        maxUses: parseInt(maxUses),
        expiresAt,
      })
      toast({ title: "Invite link created" })
    } catch (error) {
      toast({ title: "Failed to create link", variant: "destructive" })
    }
  }

  const handleCopy = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`
    navigator.clipboard.writeText(url)
    toast({ title: "Link copied to clipboard" })
  }

  const handleDelete = async (linkId: string) => {
    try {
      await deleteLinkMutation.mutateAsync(linkId)
      toast({ title: "Invite link deleted" })
    } catch (error) {
      toast({ title: "Failed to delete link", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Invite Link</CardTitle>
          <CardDescription>Generate a shareable link for people to join your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 items-end">
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Select value={maxUses} onValueChange={setMaxUses}>
                <SelectTrigger>
                  <SelectValue placeholder="Select limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Unlimited</SelectItem>
                  <SelectItem value="1">1 use</SelectItem>
                  <SelectItem value="5">5 uses</SelectItem>
                  <SelectItem value="10">10 uses</SelectItem>
                  <SelectItem value="25">25 uses</SelectItem>
                  <SelectItem value="100">100 uses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiration</Label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateLink} disabled={createLinkMutation.isPending}>
              {createLinkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Invite Links</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !inviteLinks || inviteLinks.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No active invite links. Create one above!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inviteLinks.map((link: any) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-mono text-xs">{link.code}</TableCell>
                    <TableCell>
                      {link.uses} / {link.maxUses === 0 ? "∞" : link.maxUses}
                    </TableCell>
                    <TableCell className="text-sm">
                      {link.expiresAt ? format(new Date(link.expiresAt), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell className="text-sm">{link.createdBy.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(link.code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(link.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
