"use client"

import * as React from "react"
import { Button } from "../components/button"
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover"
import { cn } from "../lib/utils"

const EMOJI_ICONS = [
  "🔥",
  "⭐",
  "🌐",
  "📊",
  "🔴",
  "💼",
  "🎯",
  "🚀",
  "⚡",
  "🎨",
  "🔧",
  "💡",
  "🎉",
  "✨",
  "📁",
  "💻",
  "📱",
  "🎮",
  "🏆",
  "🎪",
  "🌟",
  "💫",
  "🔔",
  "📢",
  "📝",
  "📚",
  "🎓",
  "🔬",
  "🔭",
  "🎬",
  "🎵",
  "🎸",
  "🎤",
  "🎧",
  "📷",
  "📹",
  "🎥",
  "📺",
  "📻",
  "☎️",
  "📞",
  "📟",
  "📠",
  "📡",
  "🔋",
  "🔌",
  "💾",
  "💿",
  "📀",
  "🖥️",
  "⌨️",
  "🖱️",
  "🖨️",
  "📊",
  "📈",
  "📉",
  "🗂️",
  "📋",
  "📌",
  "📍",
  "#",
  "🔒",
  "👥",
  "💬",
  "📧",
  "📮",
  "📬",
  "📭",
  "📫",
  "📪",
]

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
          <span className="text-lg">{value}</span>
          <span className="text-sm text-muted-foreground">Choose icon</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <p className="text-sm font-medium">Select an emoji icon</p>
          <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
            {EMOJI_ICONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                className={cn(
                  "h-10 w-10 p-0 text-lg hover:bg-accent",
                  value === emoji && "bg-accent ring-2 ring-primary",
                )}
                onClick={() => {
                  onChange(emoji)
                  setOpen(false)
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
