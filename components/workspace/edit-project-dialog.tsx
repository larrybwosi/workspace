"use client"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditProjectDialogProps {
  editProjectOpen: boolean
  setEditProjectOpen: (open: boolean) => void
  projectForm: { name: string; description: string; status: string }
  setProjectForm: (form: any) => void
  handleEditProject: () => void
}

export function EditProjectDialog({
  editProjectOpen,
  setEditProjectOpen,
  projectForm,
  setProjectForm,
  handleEditProject,
}: EditProjectDialogProps) {
  return (
    <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update project information.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={projectForm.status} onValueChange={(v) => setProjectForm({ ...projectForm, status: v })}>
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
            <Label>Description</Label>
            <Input
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditProjectOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditProject}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
