"use client"
import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useWorkspaceDepartments } from "@/hooks/api/use-workspaces"

interface CreateDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSuccess?: () => void
}

export function CreateDepartmentDialog({ open, onOpenChange, workspaceId, onSuccess }: CreateDepartmentDialogProps) {
  const [form, setForm] = React.useState({ name: "", icon: "💼", description: "" })
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()
  const { mutate: createDepartment } = useWorkspaceDepartments(workspaceId)

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Please enter a department name", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!response.ok) throw new Error("Failed to create department")

      toast({ title: "Success", description: "Department created successfully" })
      setForm({ name: "", icon: "💼", description: "" })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({ title: "Error", description: "Failed to create department", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
          <DialogDescription>Add a new department to your workspace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Department Name</Label>
            <Input
              placeholder="e.g., Engineering, Marketing"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="💼">💼 Business</SelectItem>
                <SelectItem value="💻">💻 Engineering</SelectItem>
                <SelectItem value="🎨">🎨 Design</SelectItem>
                <SelectItem value="📢">📢 Marketing</SelectItem>
                <SelectItem value="💰">💰 Finance</SelectItem>
                <SelectItem value="🤝">🤝 HR</SelectItem>
                <SelectItem value="📊">📊 Analytics</SelectItem>
                <SelectItem value="🔧">🔧 Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Describe the department's purpose..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!form.name || isLoading} loading={isLoading}>
            Create Department
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
