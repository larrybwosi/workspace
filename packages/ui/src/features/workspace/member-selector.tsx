"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Avatar, AvatarFallback } from "../../components/avatar"
import { Button } from "../../components/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/command"
import { Popover, PopoverContent, PopoverTrigger } from "../../components/popover"
import { Badge } from "../../components/badge"
import { cn } from "../../lib/utils"
import { useWorkspaceMembers } from "@repo/api-client"
import { Skeleton } from "../../components/skeleton"

interface MemberSelectorProps {
  workspaceSlug: string
  selectedMembers: string[]
  onChange: (members: string[]) => void
}

export function MemberSelector({ workspaceSlug, selectedMembers, onChange }: MemberSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const { data: members, isLoading } = useWorkspaceMembers(workspaceSlug)

  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      onChange(selectedMembers.filter((id) => id !== userId))
    } else {
      onChange([...selectedMembers, userId])
    }
  }

  const selectedUsers = React.useMemo(() => {
    if (!members) return []
    return members.filter((member: any) => selectedMembers.includes(member.user.id))
  }, [members, selectedMembers])

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
                {isLoading ? (
                  <div className="p-2 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  members?.map((member: any) => {
                    const isSelected = selectedMembers.includes(member.user.id)
                    return (
                      <CommandItem
                        key={member.user.id}
                        onSelect={() => toggleMember(member.user.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {member.user.name?.charAt(0) || member.user.email?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{member.user.name || member.user.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                          </div>
                        </div>
                        <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                    )
                  })
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((member: any) => (
            <Badge key={member.user.id} variant="secondary" className="gap-1">
              {member.user.name || member.user.email}
              <button
                onClick={() => toggleMember(member.user.id)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
