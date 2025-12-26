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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditChannelDialogProps {
  editChannelOpen: boolean
  setEditChannelOpen: (open: boolean) => void
  channelForm: { name: string; description: string; type: "public" | "private" }
  setChannelForm: (form: any) => void
  handleEditChannel: () => void
}

export function EditChannelDialog({
  editChannelOpen,
  setEditChannelOpen,
  channelForm,
  setChannelForm,
  handleEditChannel,
}: EditChannelDialogProps) {
  return (
    <Dialog open={editChannelOpen} onOpenChange={setEditChannelOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Channel</DialogTitle>
          <DialogDescription>Update channel settings.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Channel Name</Label>
            <Input
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
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Channel Description</Label>
            <Input
              value={channelForm.description}
              onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditChannelOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditChannel}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
