"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export function NotificationsTab({ workspaceId }: { workspaceId: string }) {
  const [settings, setSettings] = useState({
    notifyOnMemberJoin: true,
    notifyOnProjectCreate: true,
    notifyOnChannelCreate: false,
    notifyOnMention: true,
    notifyOnDM: true,
    weeklyDigest: true,
    securityAlerts: true,
    emailFrequency: "realtime",
    mutedChannels: [] as string[],
  })

  const handleSave = () => {
    toast.success("Notification preferences saved")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Settings</h2>
        <p className="text-muted-foreground">Configure how and when you receive notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Notifications</CardTitle>
          <CardDescription>Choose which workspace activities trigger notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">New Member Joins</Label>
              <p className="text-sm text-muted-foreground">Get notified when someone joins the workspace</p>
            </div>
            <Switch
              checked={settings.notifyOnMemberJoin}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnMemberJoin: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Project Created</Label>
              <p className="text-sm text-muted-foreground">Get notified when a new project is created</p>
            </div>
            <Switch
              checked={settings.notifyOnProjectCreate}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnProjectCreate: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Channel Created</Label>
              <p className="text-sm text-muted-foreground">Get notified when a new channel is created</p>
            </div>
            <Switch
              checked={settings.notifyOnChannelCreate}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnChannelCreate: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Mentions</Label>
              <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
            </div>
            <Switch
              checked={settings.notifyOnMention}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnMention: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Direct Messages</Label>
              <p className="text-sm text-muted-foreground">Get notified of new direct messages</p>
            </div>
            <Switch
              checked={settings.notifyOnDM}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnDM: checked })}
            />
          </div>
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
        <Button onClick={handleSave}>
          <Check className="h-4 w-4 mr-2" />
          Save Notification Preferences
        </Button>
      </div>
    </div>
  )
}
