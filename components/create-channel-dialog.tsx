"use client"

import * as React from "react"
import { Hash, Lock, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { IconPicker } from "./icon-picker"
import { MemberSelector } from "./member-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateChannel: (channel: {
    name: string
    type: string
    description: string
    isPrivate: boolean
    icon: string
    members: string[]
  }) => void
}

export function CreateChannelDialog({ open, onOpenChange, onCreateChannel }: CreateChannelDialogProps) {
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState("channel")
  const [description, setDescription] = React.useState("")
  const [isPrivate, setIsPrivate] = React.useState(false)
  const [icon, setIcon] = React.useState("#")
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([])

  const handleCreate = () => {
    if (name.trim()) {
      onCreateChannel({
        name: name.trim(),
        type,
        description: description.trim(),
        isPrivate,
        icon,
        members: selectedMembers,
      })
      // Reset form
      setName("")
      setType("channel")
      setDescription("")
      setIsPrivate(false)
      setIcon("#")
      setSelectedMembers([])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a new {type}</DialogTitle>
          <DialogDescription>
            {type === "channel"
              ? "Channels are where your team communicates. They're best organized around a topic."
              : "Groups are private spaces for smaller teams to collaborate."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup value={type} onValueChange={setType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="channel" id="channel" />
                  <Label htmlFor="channel" className="font-normal cursor-pointer flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Channel
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="group" id="group" />
                  <Label htmlFor="group" className="font-normal cursor-pointer flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Group
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">{icon}</span>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. marketing"
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this channel about?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Privacy</Label>
              <RadioGroup value={isPrivate ? "private" : "public"} onValueChange={(v) => setIsPrivate(v === "private")}>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="public" id="public" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="public" className="font-normal cursor-pointer flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Public
                    </Label>
                    <p className="text-sm text-muted-foreground">Anyone in the workspace can view and join</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="private" id="private" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="private" className="font-normal cursor-pointer flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private
                    </Label>
                    <p className="text-sm text-muted-foreground">Only invited members can view and join</p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Add Members</Label>
              <p className="text-sm text-muted-foreground">
                Select team members to add to this {type}. You can add more members later.
              </p>
              <MemberSelector selectedMembers={selectedMembers} onChange={setSelectedMembers} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create {type}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
