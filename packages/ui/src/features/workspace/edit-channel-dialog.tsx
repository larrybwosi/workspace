"use client"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/select"
import { useState, useEffect } from "react"
import { Separator } from "../../components/separator"
import { toast } from "sonner"
import { RadioGroup, RadioGroupItem } from "../../components/radio-group"

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
  channelId,
}: EditChannelDialogProps & { channelId?: string }) {
  const [preference, setPreference] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editChannelOpen && channelId) {
      const fetchPreference = async () => {
        try {
          const res = await fetch(`/api/notifications/settings/channel?channelId=${channelId}`)
          if (res.ok) {
            const data = await res.json()
            setPreference(data.notificationPreference)
          }
        } catch (error) {
          console.error("Failed to fetch channel notification settings:", error)
        }
      }
      fetchPreference()
    }
  }, [editChannelOpen, channelId])

  const handleSavePreference = async () => {
    if (!channelId) return
    setSaving(true)
    try {
      const res = await fetch("/api/notifications/settings/channel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, preference }),
      })
      if (res.ok) {
        toast.success("Channel notification preferences saved")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Failed to save channel notification preferences")
    } finally {
      setSaving(false)
    }
  }

  const onSaveAll = () => {
    handleEditChannel()
    if (channelId) {
      handleSavePreference()
    }
  }

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

          <Separator className="my-4" />

          <div className="space-y-4">
            <Label className="text-base">Notification Settings</Label>
            <RadioGroup
              value={preference || "default"}
              onValueChange={(v) => setPreference(v === "default" ? null : v)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="default" id="default" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="default" className="text-sm font-medium leading-none cursor-pointer">
                    Use Workspace Default
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Follow the notification settings of the workspace.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="all" id="all-ch" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="all-ch" className="text-sm font-medium leading-none cursor-pointer">
                    All Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified for every message in this channel.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="mentions" id="mentions-ch" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="mentions-ch" className="text-sm font-medium leading-none cursor-pointer">
                    Only @mentions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified only for mentions and @everyone/@here.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="nothing" id="nothing-ch" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="nothing-ch" className="text-sm font-medium leading-none cursor-pointer">
                    Nothing
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mute all notifications for this channel.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditChannelOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSaveAll} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
