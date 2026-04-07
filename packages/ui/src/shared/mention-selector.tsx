"use client"

import * as React from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "../ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Hash, Users, Zap } from "lucide-react"
import { cn } from "../lib/utils"

export type MentionType = "user" | "channel" | "special"

export interface MentionItem {
  id: string
  name: string
  type: MentionType
  image?: string
  description?: string
}

interface MentionSelectorProps {
  items: MentionItem[]
  onSelect: (item: MentionItem) => void
  searchTerm: string
  position: { top: number; left: number }
  type: "user" | "channel"
}

export function MentionSelector({ items, onSelect, searchTerm, position, type }: MentionSelectorProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const filteredItems = React.useMemo(() => {
    const term = searchTerm.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term))
  }, [items, searchTerm])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [searchTerm])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredItems.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex])
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [filteredItems, selectedIndex, onSelect])

  if (filteredItems.length === 0) {
    return null
  }

  return (
    <div
      className="absolute z-50 w-72 bg-popover border border-border rounded-lg shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <Command className="rounded-lg">
        <CommandList className="max-h-64">
          <CommandGroup heading={type === "user" ? "Mention user" : "Mention channel"}>
            {filteredItems.map((item, index) => (
              <CommandItem
                key={`${item.type}-${item.id}`}
                onSelect={() => onSelect(item)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer",
                  index === selectedIndex && "bg-accent",
                )}
              >
                {item.type === "user" && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={item.image} alt={item.name} />
                    <AvatarFallback className="text-xs">{item.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                {item.type === "channel" && (
                  <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                {item.type === "special" && (
                  <div className="h-6 w-6 rounded bg-amber-100 flex items-center justify-center">
                    {item.id === "all" ? <Users className="h-3.5 w-3.5 text-amber-700" /> : <Zap className="h-3.5 w-3.5 text-amber-700" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.type === "special" && (
                      <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-50 px-1 rounded">Notify All</span>
                    )}
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
