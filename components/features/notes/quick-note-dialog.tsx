"use client"

import * as React from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Save } from 'lucide-react'

interface QuickNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  onSave: (note: string) => void
}

export function QuickNoteDialog({ open, onOpenChange, date, onSave }: QuickNoteDialogProps) {
  const [note, setNote] = React.useState("")

  const handleSave = () => {
    if (note.trim()) {
      onSave(note)
      setNote("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quick Note - {format(date, "MMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Enter your note for this day..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!note.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
