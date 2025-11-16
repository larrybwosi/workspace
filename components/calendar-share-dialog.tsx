"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check } from 'lucide-react'

interface CalendarShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CalendarShareDialog({ open, onOpenChange }: CalendarShareDialogProps) {
  const [copied, setCopied] = React.useState(false)
  const calendarUrl = `${window.location.origin}/api/calendar/feed/your-token-here.ics`

  const handleCopy = () => {
    navigator.clipboard.writeText(calendarUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Calendar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Calendar Feed URL</Label>
            <div className="flex gap-2">
              <Input
                value={calendarUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this URL to subscribe to your calendar in other applications
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium text-sm">How to use:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Copy the URL above</li>
              <li>Open your calendar app (Google Calendar, Outlook, Apple Calendar)</li>
              <li>Look for "Subscribe to calendar" or "Add calendar from URL"</li>
              <li>Paste the URL and save</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
