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

interface Project {
  id: string
  name: string
}

interface DeleteProjectDialogProps {
  deleteProjectOpen: boolean
  setDeleteProjectOpen: (open: boolean) => void
  selectedProject: Project | null
  handleDeleteProject: () => void
}

export function DeleteProjectDialog({
  deleteProjectOpen,
  setDeleteProjectOpen,
  selectedProject,
  handleDeleteProject,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{selectedProject?.name}"? All tasks and data will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteProjectOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteProject}>
            Delete Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
