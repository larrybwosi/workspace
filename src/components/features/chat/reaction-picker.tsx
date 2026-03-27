"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const COMMON_REACTIONS = ["👍", "❤️", "😊", "🎉", "🚀", "👀", "🔥", "✅"]

interface ReactionPickerProps {
  onReactionSelect: (emoji: string) => void
  children: React.ReactNode
}

export function ReactionPicker({ onReactionSelect, children }: ReactionPickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (emoji: string) => {
    onReactionSelect(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {COMMON_REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-muted"
              onClick={() => handleSelect(emoji)}
            >
              <span className="text-lg">{emoji}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
