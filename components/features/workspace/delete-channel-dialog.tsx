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

interface Channel {
  id: string
  name: string
}

interface DeleteChannelDialogProps {
  deleteChannelOpen: boolean
  setDeleteChannelOpen: (open: boolean) => void
  selectedChannel: Channel | null
  handleDeleteChannel: () => void
}

export function DeleteChannelDialog({
  deleteChannelOpen,
  setDeleteChannelOpen,
  selectedChannel,
  handleDeleteChannel,
}: DeleteChannelDialogProps) {
  return (
    <Dialog open={deleteChannelOpen} onOpenChange={setDeleteChannelOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Channel</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "#{selectedChannel?.name}"? All messages will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteChannelOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteChannel}>
            Delete Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
