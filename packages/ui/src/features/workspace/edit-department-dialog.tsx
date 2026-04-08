"use client"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/select"

interface EditDeptDialogProps {
  editDeptOpen: boolean
  setEditDeptOpen: (open: boolean) => void
  deptForm: { name: string; icon: string; description: string }
  setDeptForm: (form: any) => void
  handleEditDept: () => void
}

export function EditDepartmentDialog({
  editDeptOpen,
  setEditDeptOpen,
  deptForm,
  setDeptForm,
  handleEditDept,
}: EditDeptDialogProps) {
  return (
    <Dialog open={editDeptOpen} onOpenChange={setEditDeptOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department information.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Department Name</Label>
            <Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <Select value={deptForm.icon} onValueChange={(v) => setDeptForm({ ...deptForm, icon: v })}>
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
            <Label>Description</Label>
            <Input
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditDeptOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditDept}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
