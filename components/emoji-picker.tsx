"use client"

import * as React from "react"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "./theme-provider"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  children: React.ReactNode
}

export function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false)
  const { theme } = useTheme()

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0" align="start">
        <Picker data={data} onEmojiSelect={handleEmojiSelect} theme={theme === "dark" ? "dark" : "light"} />
      </PopoverContent>
    </Popover>
  )
}
