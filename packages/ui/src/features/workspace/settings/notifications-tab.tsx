"use client"

import { useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/card"
import { Label } from "../../../components/label"
import { Switch } from "../../../components/switch"
import { Button } from "../../../components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/select"
import { Separator } from "../../../components/separator"
import { toast } from "sonner"
import { RadioGroup, RadioGroupItem } from "../../../components/radio-group"

export function NotificationsTab({ workspaceId }: { workspaceId: string }) {
  const [preference, setPreference] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false); const [settings, setSettings] = useState({ emailFrequency: "realtime", weeklyDigest: true, securityAlerts: true })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/notifications/settings/workspace?workspaceId=${workspaceId}`)
        if (res.ok) {
          const data = await res.json()
          setPreference(data.notificationPreference || "all")
        }
      } catch (error) {
        console.error("Failed to fetch notification settings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [workspaceId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/notifications/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, preference }),
      })
      if (res.ok) {
        toast.success("Notification preferences saved")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Failed to save notification preferences")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Settings</h2>
        <p className="text-muted-foreground">Configure how and when you receive notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Notifications</CardTitle>
          <CardDescription>Choose how you want to receive notifications for this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={preference} onValueChange={setPreference} className="space-y-4">
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="all" id="all" className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  All Messages
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified for every message sent in this workspace.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="mentions" id="mentions" className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="mentions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Only @mentions
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified only when you are mentioned or @everyone/@here is used.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="nothing" id="nothing" className="mt-1" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="nothing" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Nothing
                </Label>
                <p className="text-xs text-muted-foreground">
                  You will not receive any notifications for this workspace.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Control how frequently you receive email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Frequency</Label>
            <Select
              value={settings.emailFrequency}
              onValueChange={(v) => setSettings({ ...settings, emailFrequency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time - Send immediately</SelectItem>
                <SelectItem value="hourly">Hourly - Send digest every hour</SelectItem>
                <SelectItem value="daily">Daily - Send digest once per day</SelectItem>
                <SelectItem value="weekly">Weekly - Send digest once per week</SelectItem>
                <SelectItem value="never">Never - Don't send email notifications</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Weekly Activity Digest</Label>
              <p className="text-sm text-muted-foreground">Receive a summary of workspace activity every week</p>
            </div>
            <Switch
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) => setSettings({ ...settings, weeklyDigest: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">Important security notifications (always enabled)</p>
            </div>
            <Switch checked={settings.securityAlerts} disabled />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Save Notification Preferences
        </Button>
      </div>
    </div>
  )
}
