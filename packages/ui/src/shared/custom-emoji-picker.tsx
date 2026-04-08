"use client"

import * as React from "react"
import { Search, Smile, Clock, Star, Sparkles, ImageIcon, Loader2, Lock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { useTheme } from "../layout/theme-provider"
import { useCustomEmojis, useEligibleAssets } from "@repo/api-client"
import { cn } from "../lib/utils"

interface CustomEmoji {
  id: string
  name: string
  shortcode: string
  imageUrl: string
  animated: boolean
  category: string
}

interface CustomEmojiPickerProps {
  onEmojiSelect: (emoji: string, isCustom?: boolean, customEmojiId?: string) => void
  children: React.ReactNode
  workspaceId?: string
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🚀", "👀", "🔥", "✅", "❌"]

export function CustomEmojiPicker({ onEmojiSelect, children, workspaceId }: CustomEmojiPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("quick")
  const { theme } = useTheme()

  const { data: eligibleAssets, isLoading: isLoadingEligible } = useEligibleAssets()

  const customEmojis = eligibleAssets?.emojis || []
  const isLoadingCustom = isLoadingEligible

  const filteredCustomEmojis = (customEmojis || []).filter(
    (emoji: any) =>
      emoji.name.toLowerCase().includes(search.toLowerCase()) ||
      emoji.shortcode.toLowerCase().includes(search.toLowerCase()),
  )

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji, false)
    setOpen(false)
  }

  const handleCustomEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.shortcode, true, emoji.id)
    setOpen(false)
  }

  const handleStandardEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native, false)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b p-2">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="quick" className="text-xs">
                <Star className="h-3.5 w-3.5 mr-1" />
                Quick
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Custom
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                <Smile className="h-3.5 w-3.5 mr-1" />
                All
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="quick" className="m-0 p-3">
            <p className="text-xs text-muted-foreground mb-2">Quick Reactions</p>
            <div className="grid grid-cols-6 gap-1">
              {QUICK_REACTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-muted hover:scale-110 transition-transform"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  <span className="text-xl">{emoji}</span>
                </Button>
              ))}
            </div>

            {customEmojis && customEmojis.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground mt-4 mb-2">Workspace Emojis</p>
                <div className="grid grid-cols-6 gap-1">
                  {customEmojis.slice(0, 6).map((emoji: any) => (
                    <Button
                      key={emoji.id}
                      variant="ghost"
                      size="sm"
                      disabled={!emoji.isEligible}
                      className={cn(
                        "h-10 w-10 p-0 hover:bg-muted hover:scale-110 transition-transform relative",
                        !emoji.isEligible && "opacity-60 grayscale cursor-not-allowed"
                      )}
                      onClick={() => handleCustomEmojiSelect(emoji)}
                      title={emoji.shortcode}
                    >
                      <img
                        src={emoji.imageUrl || "/placeholder.svg"}
                        alt={emoji.name}
                        className="h-6 w-6 object-contain"
                      />
                      {!emoji.isEligible && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                          <Lock className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {emoji.animated && (
                        <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground rounded px-0.5">
                          GIF
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="custom" className="m-0">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search custom emojis..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8"
                />
              </div>
            </div>
            <ScrollArea className="h-[250px]">
              <div className="p-2">
                {isLoadingCustom ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCustomEmojis.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No custom emojis found</p>
                    <p className="text-xs text-muted-foreground mt-1">Ask an admin to add custom emojis</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-1">
                    {filteredCustomEmojis.map((emoji: any) => (
                      <Button
                        key={emoji.id}
                        variant="ghost"
                        size="sm"
                        disabled={!emoji.isEligible}
                        className={cn(
                          "h-10 w-10 p-0 hover:bg-muted hover:scale-110 transition-transform relative group",
                          !emoji.isEligible && "opacity-60 grayscale cursor-not-allowed"
                        )}
                        onClick={() => handleCustomEmojiSelect(emoji)}
                        title={emoji.shortcode}
                      >
                        <img
                          src={emoji.imageUrl || "/placeholder.svg"}
                          alt={emoji.name}
                          className="h-6 w-6 object-contain"
                        />
                        {!emoji.isEligible && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                            <Lock className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {emoji.animated && (
                          <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground rounded px-0.5">
                            GIF
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="m-0 p-0">
            <Picker
              data={data}
              onEmojiSelect={handleStandardEmojiSelect}
              theme={theme === "dark" ? "dark" : "light"}
              previewPosition="none"
              skinTonePosition="none"
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
