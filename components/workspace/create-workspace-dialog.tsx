"use client"
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

interface CreateChannelDialogProps {
  createChannelOpen: boolean
  setCreateChannelOpen: (open: boolean) => void
  channelForm: { name: string; description: string; type: "public" | "private" }
  setChannelForm: (form: any) => void
  handleCreateChannel: () => void
}

export function CreateChannelDialog({
  createChannelOpen,
  setCreateChannelOpen,
  channelForm,
  setChannelForm,
  handleCreateChannel,
}: CreateChannelDialogProps) {
  return (
    <Dialog open={createChannelOpen} onOpenChange={setCreateChannelOpen}>
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
              value={channelForm.name}
              onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Channel Type</Label>
            <Select
              value={channelForm.type}
              onValueChange={(v: "public" | "private") => setChannelForm({ ...channelForm, type: v })}
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
              value={channelForm.description}
              onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateChannelOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateChannel} disabled={!channelForm.name}>
            Create Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
