"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar, Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CalendarIntegrationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CalendarIntegrationsDialog({ open, onOpenChange }: CalendarIntegrationsDialogProps) {
  const [integrations, setIntegrations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      fetchIntegrations()
    }
  }, [open])

  const fetchIntegrations = async () => {
    try {
      setError(null)
      const response = await fetch('/api/calendar/integrations')
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[v0] API Error:', errorText)
        throw new Error(`Failed to fetch integrations: ${response.statusText}`)
      }
      
      const data = await response.json()
      setIntegrations(data)
    } catch (error) {
      console.error('[v0] Failed to fetch integrations:', error)
      setError(error instanceof Error ? error.message : 'Failed to load calendar integrations')
    }
  }

  const handleConnect = async (provider: 'google' | 'outlook') => {
    setLoading(true)
    try {
      const redirectUri = `${window.location.origin}/api/calendar/auth/${provider}`
      
      if (provider === 'google') {
        const params = new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
          state: crypto.randomUUID(),
        })
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      } else if (provider === 'outlook') {
        const params = new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID!,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'Calendars.ReadWrite offline_access',
          state: crypto.randomUUID(),
        })
        window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
      }
    } catch (error) {
      console.error('[v0] Connection error:', error)
      setLoading(false)
    }
  }

  const handleToggleSync = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/calendar/integrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncEnabled: enabled }),
      })
      fetchIntegrations()
    } catch (error) {
      console.error('[v0] Toggle sync error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/calendar/integrations/${id}`, {
        method: 'DELETE',
      })
      fetchIntegrations()
    } catch (error) {
      console.error('[v0] Delete error:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Calendar Integrations</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {integrations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Connected Calendars</h3>
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5" />
                    <div>
                      <p className="font-medium capitalize">{integration.provider}</p>
                      <p className="text-sm text-muted-foreground">{integration.accountEmail}</p>
                      {integration.lastSyncAt && (
                        <p className="text-xs text-muted-foreground">
                          Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integration.syncEnabled}
                      onCheckedChange={(checked) => handleToggleSync(integration.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(integration.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Connect New Calendar</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => handleConnect('google')}
                disabled={loading}
              >
                <Calendar className="h-6 w-6" />
                <span className="font-medium">Google Calendar</span>
                <span className="text-xs text-muted-foreground">
                  Sync with your Google Calendar
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => handleConnect('outlook')}
                disabled={loading}
              >
                <Calendar className="h-6 w-6" />
                <span className="font-medium">Outlook Calendar</span>
                <span className="text-xs text-muted-foreground">
                  Sync with your Outlook Calendar
                </span>
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Connected calendars will automatically sync events both ways. You can disable sync
              at any time without disconnecting.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
