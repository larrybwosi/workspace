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

interface Department {
  id: string
  name: string
}

interface DeleteDeptDialogProps {
  deleteDeptOpen: boolean
  setDeleteDeptOpen: (open: boolean) => void
  selectedDept: Department | null
  handleDeleteDept: () => void
}

export function DeleteDepartmentDialog({
  deleteDeptOpen,
  setDeleteDeptOpen,
  selectedDept,
  handleDeleteDept,
}: DeleteDeptDialogProps) {
  return (
    <Dialog open={deleteDeptOpen} onOpenChange={setDeleteDeptOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Department</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{selectedDept?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDeptOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteDept}>
            Delete Department
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
