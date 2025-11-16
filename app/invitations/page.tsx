"use client"

import type React from "react"

import { useState } from "react"
import { useInvitations, useCreateInvitation, useResendInvitation } from "@/hooks/api/use-invitations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Mail, Plus, Copy, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function InvitationsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const { data: invitations, isLoading } = useInvitations()
  const createInvitation = useCreateInvitation()
  const resendInvitation = useResendInvitation()

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createInvitation.mutateAsync({ email })
      setEmail("")
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to create invitation:", error)
    }
  }

  const copyInvitationLink = (link: string, token: string) => {
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "expired":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Invitations</h1>
            <p className="text-muted-foreground mt-1">Manage team invitations and track their status</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Invitation</DialogTitle>
                <DialogDescription>Invite a new team member by email</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateInvitation}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createInvitation.isPending}>
                    {createInvitation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading invitations...</p>
          </Card>
        ) : invitations && invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map((invitation: any) => (
              <Card key={invitation.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(invitation.status)}
                        <Badge
                          variant={
                            invitation.status === "accepted"
                              ? "default"
                              : invitation.status === "expired"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {invitation.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(invitation.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {invitation.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyInvitationLink(`${window.location.origin}/invite/${invitation.token}`, invitation.token)
                        }
                      >
                        {copiedToken === invitation.token ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvitation.mutate(invitation.token)}
                        disabled={resendInvitation.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resend
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invitations yet</h3>
            <p className="text-muted-foreground mb-4">Start inviting team members to collaborate</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Send Your First Invitation
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
