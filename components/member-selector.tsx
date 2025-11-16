"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { mockUsers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface MemberSelectorProps {
  selectedMembers: string[]
  onChange: (members: string[]) => void
}

export function MemberSelector({ selectedMembers, onChange }: MemberSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      onChange(selectedMembers.filter((id) => id !== userId))
    } else {
      onChange([...selectedMembers, userId])
    }
  }

  const selectedUsers = mockUsers.filter((user) => selectedMembers.includes(user.id))

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            {selectedMembers.length === 0 ? (
              <span className="text-muted-foreground">Select members...</span>
            ) : (
              <span>{selectedMembers.length} member(s) selected</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search members..." />
            <CommandList>
              <CommandEmpty>No members found.</CommandEmpty>
              <CommandGroup>
                {mockUsers.map((user) => {
                  const isSelected = selectedMembers.includes(user.id)
                  return (
                    <CommandItem key={user.id} onSelect={() => toggleMember(user.id)} className="cursor-pointer">
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{user.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                        </div>
                      </div>
                      <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="gap-1">
              {user.name}
              <button onClick={() => toggleMember(user.id)} className="ml-1 hover:bg-muted-foreground/20 rounded-full">
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
