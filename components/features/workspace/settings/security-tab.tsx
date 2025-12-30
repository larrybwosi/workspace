"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export function SecurityTab({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient()

  const { data: securitySettings, isLoading } = useQuery({
    queryKey: ["workspace-security", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/security`)
      return data
    },
  })

  const [settings, setSettings] = useState({
    requireMfa: false,
    allowGuestAccess: true,
    sessionTimeout: "24",
    ipWhitelist: "",
    domainRestriction: "",
    ssoEnabled: false,
    passwordMinLength: "8",
    passwordRequireSpecialChar: true,
    passwordExpiry: "90",
  })

  useEffect(() => {
    if (securitySettings) {
      setSettings(securitySettings)
    }
  }, [securitySettings])

  const updateSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.patch(`/workspaces/${workspaceId}/security`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-security", workspaceId] })
      toast.success("Security settings saved")
    },
    onError: () => {
      toast.error("Failed to save settings")
    },
  })

  const handleSave = () => {
    updateSettings.mutate(settings)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading security settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Settings</h2>
        <p className="text-muted-foreground">Configure security policies and access controls</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Manage authentication requirements and multi-factor authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Require Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">All members must enable 2FA to access the workspace</p>
            </div>
            <Switch
              checked={settings.requireMfa}
              onCheckedChange={(checked) => setSettings({ ...settings, requireMfa: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Single Sign-On (SSO)</Label>
              <p className="text-sm text-muted-foreground">
                Allow members to sign in with SAML 2.0
                <Badge className="ml-2" variant="outline">
                  Enterprise
                </Badge>
              </p>
            </div>
            <Switch
              checked={settings.ssoEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, ssoEnabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Session Timeout (hours)</Label>
            <Select
              value={settings.sessionTimeout}
              onValueChange={(v) => setSettings({ ...settings, sessionTimeout: v })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="168">7 days</SelectItem>
                <SelectItem value="720">30 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Inactive users will be logged out after this period</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>Configure IP restrictions and domain-based access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Allow Guest Access</Label>
              <p className="text-sm text-muted-foreground">External users can be invited as guests</p>
            </div>
            <Switch
              checked={settings.allowGuestAccess}
              onCheckedChange={(checked) => setSettings({ ...settings, allowGuestAccess: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>IP Whitelist</Label>
            <Textarea
              placeholder="192.168.1.0/24&#10;10.0.0.1"
              value={settings.ipWhitelist}
              onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              One IP address or CIDR range per line. Leave blank to allow all IPs.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Domain Restriction</Label>
            <Input
              placeholder="@company.com"
              value={settings.domainRestriction}
              onChange={(e) => setSettings({ ...settings, domainRestriction: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Only allow email addresses from specific domains</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Policy</CardTitle>
          <CardDescription>Set minimum requirements for user passwords</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Minimum Password Length</Label>
            <Select
              value={settings.passwordMinLength}
              onValueChange={(v) => setSettings({ ...settings, passwordMinLength: v })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 characters</SelectItem>
                <SelectItem value="10">10 characters</SelectItem>
                <SelectItem value="12">12 characters</SelectItem>
                <SelectItem value="16">16 characters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Require Special Characters</Label>
              <p className="text-sm text-muted-foreground">Passwords must contain at least one special character</p>
            </div>
            <Switch
              checked={settings.passwordRequireSpecialChar}
              onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireSpecialChar: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Password Expiration (days)</Label>
            <Select
              value={settings.passwordExpiry}
              onValueChange={(v) => setSettings({ ...settings, passwordExpiry: v })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          <Check className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? "Saving..." : "Save Security Settings"}
        </Button>
      </div>
    </div>
  )
}
