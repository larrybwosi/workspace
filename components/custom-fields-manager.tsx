"use client"
import * as React from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface CustomField {
  id: string
  name: string
  type: "text" | "number" | "date" | "select" | "multiselect" | "checkbox" | "url"
  options?: string[]
  required: boolean
  defaultValue?: string
}

interface CustomFieldsManagerProps {
  entityType: "project" | "task"
  fields: CustomField[]
  onFieldsChange: (fields: CustomField[]) => void
}

export function CustomFieldsManager({ entityType, fields, onFieldsChange }: CustomFieldsManagerProps) {
  const [open, setOpen] = React.useState(false)
  const [editingField, setEditingField] = React.useState<CustomField | null>(null)
  const [fieldName, setFieldName] = React.useState("")
  const [fieldType, setFieldType] = React.useState<CustomField["type"]>("text")
  const [fieldOptions, setFieldOptions] = React.useState("")
  const [fieldRequired, setFieldRequired] = React.useState(false)

  const handleAddField = () => {
    const newField: CustomField = {
      id: `field-${Date.now()}`,
      name: fieldName,
      type: fieldType,
      options:
        fieldType === "select" || fieldType === "multiselect"
          ? fieldOptions.split(",").map((o) => o.trim())
          : undefined,
      required: fieldRequired,
    }

    onFieldsChange([...fields, newField])
    resetForm()
    setOpen(false)
  }

  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId))
  }

  const resetForm = () => {
    setFieldName("")
    setFieldType("text")
    setFieldOptions("")
    setFieldRequired(false)
    setEditingField(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Add custom fields to capture additional information for {entityType}s
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Field</DialogTitle>
              <DialogDescription>Create a new custom field for {entityType}s</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="field-name">Field Name</Label>
                <Input
                  id="field-name"
                  placeholder="e.g., Budget, Client Name, Department"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-type">Field Type</Label>
                <Select value={fieldType} onValueChange={(value) => setFieldType(value as CustomField["type"])}>
                  <SelectTrigger id="field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="multiselect">Multi-select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(fieldType === "select" || fieldType === "multiselect") && (
                <div className="space-y-2">
                  <Label htmlFor="field-options">Options (comma-separated)</Label>
                  <Input
                    id="field-options"
                    placeholder="e.g., Option 1, Option 2, Option 3"
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="field-required"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="field-required" className="cursor-pointer">
                  Required field
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddField} disabled={!fieldName}>
                Add Field
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {fields.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No custom fields yet. Add one to get started.</p>
          </Card>
        ) : (
          fields.map((field) => (
            <Card key={field.id} className="p-4">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{field.name}</p>
                    {field.required && <span className="text-xs text-destructive">*</span>}
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{field.type}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteField(field.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
