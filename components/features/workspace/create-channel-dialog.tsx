"use client"
import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Hash, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSuccess?: () => void
}

export function CreateChannelDialog({ open, onOpenChange, workspaceId, onSuccess }: CreateChannelDialogProps) {
  const [form, setForm] = React.useState({ name: "", description: "", type: "public" as "public" | "private" })
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Please enter a channel name", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!response.ok) throw new Error("Failed to create channel")

      toast({ title: "Success", description: "Channel created successfully" })
      setForm({ name: "", description: "", type: "public" })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({ title: "Error", description: "Failed to create channel", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!form.name || isLoading} loading={isLoading}>
            Create Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
