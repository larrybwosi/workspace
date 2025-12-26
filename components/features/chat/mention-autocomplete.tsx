"use client"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockUsers } from "@/lib/mock-data"

interface MentionAutocompleteProps {
  query: string
  onSelect: (userId: string, userName: string) => void
  position: { top: number; left: number }
}

export function MentionAutocomplete({ query, onSelect, position }: MentionAutocompleteProps) {
  const filteredUsers = mockUsers.filter((user) => user.name.toLowerCase().includes(query.toLowerCase()))

  if (filteredUsers.length === 0) return null

  return (
    <div
      className="absolute z-50 w-64 bg-popover border border-border rounded-lg shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <Command>
        <CommandList>
          <CommandEmpty>No users found.</CommandEmpty>
          <CommandGroup heading="Mention user">
            {filteredUsers.map((user) => (
              <CommandItem
                key={user.id}
                onSelect={() => onSelect(user.id, user.name)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{user.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
