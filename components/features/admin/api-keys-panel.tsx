"use client"

import * as React from "react"
import { Key, Plus, Copy, Trash2, Eye, EyeOff, MoreVertical, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useApiKeys, useCreateApiKey, useDeleteApiKey, useUpdateApiKey } from "@/hooks/api/use-integrations"
import { CreateApiKeyDialog } from "@/components/features/settings/create-api-key-dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ApiKeysPanel() {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [deleteKeyId, setDeleteKeyId] = React.useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set())
  
  const { data: keys, isLoading } = useApiKeys()
  const deleteMutation = useDeleteApiKey()
  const updateMutation = useUpdateApiKey()

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success("API key copied to clipboard")
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const handleDelete = async () => {
    if (!deleteKeyId) return
    
    try {
      await deleteMutation.mutateAsync(deleteKeyId)
      toast.success("API key deleted successfully")
      setDeleteKeyId(null)
    } catch (error) {
      toast.error("Failed to delete API key")
    }
  }

  const toggleKeyStatus = async (keyId: string, isActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ keyId, isActive: !isActive })
      toast.success(isActive ? "API key deactivated" : "API key activated")
    } catch (error) {
      toast.error("Failed to update API key")
    }
  }

  const maskKey = (key: string) => {
    return `${key.slice(0, 8)}${"•".repeat(20)}${key.slice(-4)}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage API keys for programmatic access to your workspace
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            API Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Include your API key in the request header:</p>
          <code className="block bg-muted p-2 rounded text-xs">
            X-API-Key: your_api_key_here
          </code>
          <p className="text-xs">
            Keep your keys secure and never share them publicly. Keys can be revoked at any time.
          </p>
        </CardContent>
      </Card>

      {/* Keys List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading API keys...</div>
      ) : keys?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No API keys yet</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys?.map((apiKey: any) => (
            <Card key={apiKey.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{apiKey.name}</h3>
                      <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                        {apiKey.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          "Inactive"
                        )}
                      </Badge>
                      {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-sm bg-muted p-3 rounded">
                      <span className="flex-1">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyKey(apiKey.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(apiKey.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last used:</span>{" "}
                        <span className="font-medium">
                          {apiKey.lastUsedAt
                            ? format(new Date(apiKey.lastUsedAt), "MMM d, yyyy")
                            : "Never"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rate limit:</span>{" "}
                        <span className="font-medium">{apiKey.rateLimit} req/hour</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expires:</span>{" "}
                        <span className="font-medium">
                          {apiKey.expiresAt
                            ? format(new Date(apiKey.expiresAt), "MMM d, yyyy")
                            : "Never"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Permissions:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {apiKey.permissions.map((perm: string) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleKeyStatus(apiKey.id, apiKey.isActive)}
                      >
                        {apiKey.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteKeyId(apiKey.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateApiKeyDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone and any
              applications using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
