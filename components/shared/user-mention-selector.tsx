"use client"

import * as React from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  email?: string
  avatar?: string
}

interface UserMentionSelectorProps {
  users: User[]
  onSelect: (user: User) => void
  searchTerm: string
  position: { top: number; left: number }
}

export function UserMentionSelector({ users, onSelect, searchTerm, position }: UserMentionSelectorProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const filteredUsers = React.useMemo(() => {
    const term = searchTerm.toLowerCase()
    return users.filter((user) => user.name.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term))
  }, [users, searchTerm])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [searchTerm])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredUsers[selectedIndex]) {
          onSelect(filteredUsers[selectedIndex])
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [filteredUsers, selectedIndex, onSelect])

  if (filteredUsers.length === 0) {
    return null
  }

  return (
    <div
      className="absolute z-50 w-72 bg-popover border border-border rounded-lg shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <Command className="rounded-lg">
        <CommandList className="max-h-64">
          <CommandGroup heading="Mention user">
            {filteredUsers.map((user, index) => (
              <CommandItem
                key={user.id}
                onSelect={() => onSelect(user)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer",
                  index === selectedIndex && "bg-accent",
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="text-xs">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
