"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "../../components/popover"
import { Button } from "../../components/button"
import { CustomEmojiPicker } from "../../shared/custom-emoji-picker"
import { Smile, Sparkles } from "lucide-react"

const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🚀", "👀", "🔥", "✅", "❌"]

interface ReactionPickerProps {
  onReactionSelect: (emoji: string, isCustom?: boolean, customEmojiId?: string) => void
  children: React.ReactNode
  workspaceId?: string
}

export function ReactionPicker({ onReactionSelect, children, workspaceId }: ReactionPickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (emoji: string) => {
    onReactionSelect(emoji, false)
    setOpen(false)
  }

  const handleCustomSelect = (emoji: string, isCustom?: boolean, customEmojiId?: string) => {
    onReactionSelect(emoji, isCustom, customEmojiId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex flex-col gap-2">
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
          <div className="border-t pt-2">
             <CustomEmojiPicker onEmojiSelect={handleCustomSelect} workspaceId={workspaceId}>
               <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8 gap-2">
                 <Sparkles className="h-3.5 w-3.5" />
                 More Reactions...
               </Button>
             </CustomEmojiPicker>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
