"use client"

import React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "../../lib/utils"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/dialog"
import { Button } from "../../components/button"
import { Label } from "../../components/label"
import { Input } from "../../components/input"
import { Textarea } from "../../components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/select"
import { Calendar } from "../../components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../components/popover"
import { useToast } from "../../hooks/use-toast"
import { useCreateWorkspaceProject } from "@repo/api-client"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string // This is now treated as workspaceSlug
  onSuccess?: () => void
}

export function CreateProjectDialog({ open, onOpenChange, workspaceId: workspaceSlug, onSuccess }: CreateProjectDialogProps) {
  const [form, setForm] = React.useState({ 
    name: "", 
    description: "", 
    status: "planning",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  })
  const { toast } = useToast()
  const createProject = useCreateWorkspaceProject(workspaceSlug)

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Please enter a project name", variant: "destructive" })
      return
    }

    createProject.mutate({
      name: form.name,
      description: form.description,
      status: form.status,
      startDate: form.startDate?.toISOString() || new Date().toISOString(),
      endDate: form.endDate?.toISOString() || new Date().toISOString(),
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Project created successfully" })
        setForm({ name: "", description: "", status: "planning", startDate: undefined, endDate: undefined })
        onOpenChange(false)
        onSuccess?.()
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create project", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Start a new project in your workspace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input
              placeholder="e.g., Q1 Product Launch"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.startDate ? format(form.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.startDate}
                    onSelect={(date) => setForm({ ...form, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.endDate ? format(form.endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.endDate}
                    onSelect={(date) => setForm({ ...form, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Describe the project..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createProject.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!form.name || createProject.isPending}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}