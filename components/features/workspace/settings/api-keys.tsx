"use client"

import { useState } from "react"
import { Plus, Copy, Trash2, Key, Check, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ApiKeysManagementProps {
  workspaceId: string
}

const AVAILABLE_PERMISSIONS = [
  { id: "read:members", label: "Read Members", category: "Members" },
  { id: "write:members", label: "Write Members", category: "Members" },
  { id: "read:departments", label: "Read Departments", category: "Departments" },
  { id: "write:departments", label: "Write Departments", category: "Departments" },
  { id: "read:channels", label: "Read Channels", category: "Channels" },
  { id: "write:channels", label: "Write Channels", category: "Channels" },
  { id: "send:messages", label: "Send Messages", category: "Messages" },
  { id: "read:projects", label: "Read Projects", category: "Projects" },
  { id: "write:projects", label: "Write Projects", category: "Projects" },
]

export function ApiKeysManagement({ workspaceId }: ApiKeysManagementProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewTokenDialog, setViewTokenDialog] = useState<any>(null)
  const [copiedToken, setCopiedToken] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
    rateLimit: "1000",
    expiresIn: "never",
  })

  // Fetch API keys
  const { data, isLoading } = useQuery({
    queryKey: ["workspace-api-tokens", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/api-tokens`)
      if (!res.ok) throw new Error("Failed to fetch API keys")
      return res.json()
    },
  })

  const tokens = data?.tokens || []

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/api-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create API key")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-api-tokens", workspaceId] })
      setCreateDialogOpen(false)
      setViewTokenDialog(data)
      setFormData({
        name: "",
        permissions: [],
        rateLimit: "1000",
        expiresIn: "never",
      })
      toast({
        title: "API key created",
        description: "Your API key has been created successfully. Make sure to copy it now.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create API key",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/api-tokens/${tokenId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete API key")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-api-tokens", workspaceId] })
      toast({
        title: "API key deleted",
        description: "The API key has been revoked and can no longer be used.",
      })
    },
  })

  const handleCreateToken = () => {
    const expiresAt =
      formData.expiresIn !== "never"
        ? new Date(Date.now() + Number.parseInt(formData.expiresIn) * 24 * 60 * 60 * 1000).toISOString()
        : undefined

    createMutation.mutate({
      name: formData.name,
      permissions: {
        actions: formData.permissions,
      },
      rateLimit: Number.parseInt(formData.rateLimit),
      expiresAt,
    })
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
    toast({
      title: "Copied to clipboard",
      description: "API key has been copied to your clipboard.",
    })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading API keys...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Keys</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage API keys for programmatic access to your workspace
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* API Keys List */}
      <div className="space-y-3">
        {tokens.map((token: any) => (
          <Card key={token.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">{token.name}</h4>
                    {token.expiresAt && new Date(token.expiresAt) < new Date() && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">{token.token}</span>
                    <span>•</span>
                    <span>Created {format(new Date(token.createdAt), "MMM d, yyyy")}</span>
                    {token.lastUsedAt && (
                      <>
                        <span>•</span>
                        <span>Last used {format(new Date(token.lastUsedAt), "MMM d, yyyy")}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(token.permissions?.actions || []).map((perm: string) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(token.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tokens.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create API keys to integrate external services with your workspace
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First API Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Generate a new API key for programmatic access to your workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input
                placeholder="e.g., Production Integration"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-lg p-4 space-y-4">
                {Object.entries(
                  AVAILABLE_PERMISSIONS.reduce(
                    (acc, perm) => {
                      if (!acc[perm.category]) acc[perm.category] = []
                      acc[perm.category].push(perm)
                      return acc
                    },
                    {} as Record<string, typeof AVAILABLE_PERMISSIONS>,
                  ),
                ).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm.id}
                            checked={formData.permissions.includes(perm.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, permissions: [...formData.permissions, perm.id] })
                              } else {
                                setFormData({
                                  ...formData,
                                  permissions: formData.permissions.filter((p) => p !== perm.id),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={perm.id} className="text-sm font-normal cursor-pointer">
                            {perm.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate Limit (requests/hour)</Label>
                <Select value={formData.rateLimit} onValueChange={(v) => setFormData({ ...formData, rateLimit: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100/hour</SelectItem>
                    <SelectItem value="1000">1,000/hour</SelectItem>
                    <SelectItem value="10000">10,000/hour</SelectItem>
                    <SelectItem value="100000">100,000/hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiration</Label>
                <Select value={formData.expiresIn} onValueChange={(v) => setFormData({ ...formData, expiresIn: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateToken}
                disabled={!formData.name || formData.permissions.length === 0 || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create API Key"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Token Dialog */}
      <Dialog open={!!viewTokenDialog} onOpenChange={() => setViewTokenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>Copy your API key now. It won't be shown again.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important: Save your API key</p>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This key will only be shown once. Store it securely in your application.
              </p>
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input value={viewTokenDialog?.token || ""} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => viewTokenDialog?.token && copyToken(viewTokenDialog.token)}
                >
                  {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
