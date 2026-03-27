"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateApiKey } from "@/hooks/api/use-integrations"
import { toast } from "sonner"
import { Copy, CheckCircle2 } from 'lucide-react'

const AVAILABLE_PERMISSIONS = [
  { id: "messages:read", label: "Read Messages", description: "View messages in channels" },
  { id: "messages:write", label: "Write Messages", description: "Send messages to channels" },
  { id: "tasks:read", label: "Read Tasks", description: "View tasks and projects" },
  { id: "tasks:write", label: "Write Tasks", description: "Create and update tasks" },
  { id: "projects:read", label: "Read Projects", description: "View project information" },
  { id: "projects:write", label: "Write Projects", description: "Create and update projects" },
  { id: "users:read", label: "Read Users", description: "View user information" },
  { id: "webhooks:manage", label: "Manage Webhooks", description: "Create and update webhooks" },
]

interface CreateApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const [name, setName] = React.useState("")
  const [rateLimit, setRateLimit] = React.useState("1000")
  const [expiresInDays, setExpiresInDays] = React.useState("365")
  const [permissions, setPermissions] = React.useState<string[]>([])
  const [createdKey, setCreatedKey] = React.useState<string | null>(null)
  
  const createMutation = useCreateApiKey()

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the API key")
      return
    }

    if (permissions.length === 0) {
      toast.error("Please select at least one permission")
      return
    }

    try {
      const result = await createMutation.mutateAsync({
        name: name.trim(),
        permissions,
        rateLimit: parseInt(rateLimit) || 1000,
        expiresInDays: parseInt(expiresInDays) || 365,
      })
      
      setCreatedKey(result.key)
      toast.success("API key created successfully")
    } catch (error) {
      toast.error("Failed to create API key")
    }
  }

  const handleClose = () => {
    setName("")
    setRateLimit("1000")
    setExpiresInDays("365")
    setPermissions([])
    setCreatedKey(null)
    onOpenChange(false)
  }

  const handleCopyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      toast.success("API key copied to clipboard")
    }
  }

  const togglePermission = (permId: string) => {
    setPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-muted p-3 rounded font-mono text-sm break-all">
              <span className="flex-1">{createdKey}</span>
              <Button size="sm" variant="ghost" onClick={handleCopyKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Store this key securely. It provides access to your workspace data based on the
              permissions you granted.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Generate a new API key for programmatic access to your workspace
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Key Name</Label>
            <Input
              id="name"
              placeholder="e.g., Production Server, Mobile App"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
              <Input
                id="rateLimit"
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Expires In (days)</Label>
              <Input
                id="expires"
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Set to 0 for no expiration</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <p className="text-sm text-muted-foreground">
              Select which operations this API key can perform
            </p>
            <div className="space-y-3">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <div key={perm.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={perm.id}
                    checked={permissions.includes(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={perm.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {perm.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{perm.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create API Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
