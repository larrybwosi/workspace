"use client"
import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/dialog"
import { Button } from "../../components/button"
import { Label } from "../../components/label"
import { Input } from "../../components/input"
import { Textarea } from "../../components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/select"
import { Hash, Lock } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { useCreateChannel } from "@repo/api-client"

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string // This is now treated as workspaceSlug
  onSuccess?: () => void
}

export function CreateChannelDialog({ open, onOpenChange, workspaceId: workspaceSlug, onSuccess }: CreateChannelDialogProps) {
  const [form, setForm] = React.useState({ name: "", description: "", type: "public" as "public" | "private" })
  const { toast } = useToast()
  const createChannel = useCreateChannel(workspaceSlug)

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Please enter a channel name", variant: "destructive" })
      return
    }

    createChannel.mutate({
      name: form.name,
      description: form.description,
      type: form.type,
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Channel created successfully" })
        setForm({ name: "", description: "", type: "public" })
        onOpenChange(false)
        onSuccess?.()
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create channel", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>Add a new communication channel.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Channel Name</Label>
            <Input
              placeholder="e.g., general, announcements"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Channel Type</Label>
            <Select
              value={form.type}
              onValueChange={(v: "public" | "private") => setForm({ ...form, type: v })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Public - Anyone can join
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private - Invite only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="What is this channel about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createChannel.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!form.name || createChannel.isPending}>
            Create Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
