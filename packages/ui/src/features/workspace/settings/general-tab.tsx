"use client"

import { useState, useEffect } from "react"
import { Copy, Upload, Globe, Palette } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/card"
import { Input } from "../../../components/input"
import { Label } from "../../../components/label"
import { Textarea } from "../../../components/textarea"
import { Button } from "../../../components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/select"
import { Switch } from "../../../components/switch"
import { toast } from "sonner"
import { useWorkspace, useUpdateWorkspace } from "@repo/api-client"

interface GeneralTabProps {
  workspaceSlug: string
}

export function GeneralTab({ workspaceSlug }: GeneralTabProps) {
  const { data: workspace } = useWorkspace(workspaceSlug)
  const updateWorkspace = useUpdateWorkspace(workspaceSlug)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [customDomain, setCustomDomain] = useState("")
  const [industry, setIndustry] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [accentColor, setAccentColor] = useState("#8b5cf6")
  const [timezone, setTimezone] = useState("UTC")
  const [language, setLanguage] = useState("en")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || "")
      setDescription(workspace.description || "")
      setIcon(workspace.icon || "")
      setIsPublic(workspace.isPublic || false)
      setCustomDomain(workspace.customDomain || "")
      setIndustry(workspace.industry || "")
      if (workspace.brandingConfig) {
        setPrimaryColor(workspace.brandingConfig.colors?.primary || "#3b82f6")
        setAccentColor(workspace.brandingConfig.colors?.accent || "#8b5cf6")
      }
    }
  }, [workspace])

  const handleSave = async () => {
    try {
      await updateWorkspace.mutateAsync({
        name,
        description,
        icon,
        isPublic,
        customDomain,
        industry,
        brandingConfig: {
          colors: {
            primary: primaryColor,
            accent: accentColor
          }
        }
      })
      toast.success("Workspace settings saved")
    } catch {
      toast.error("Failed to save settings")
    }
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`app.domain.com/${workspace?.slug || "workspace"}`)
    toast.success("URL copied to clipboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">General Settings</h2>
        <p className="text-muted-foreground">Manage your workspace profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Profile</CardTitle>
          <CardDescription>Update your workspace information visible to all members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
              {icon || name?.charAt(0) || "W"}
            </div>
            <div className="flex-1 space-y-2">
              <Label>Workspace Icon</Label>
              <div className="flex gap-2">
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="Enter emoji"
                  className="w-32"
                  maxLength={2}
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Use an emoji or upload an image</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Organization"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your workspace..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Workspace URL</Label>
            <div className="flex items-center gap-2">
              <Input value={`app.domain.com/${workspace?.slug || "workspace"}`} disabled className="bg-muted" />
              <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">This URL cannot be changed</p>
          </div>

          <div className="flex items-center justify-between space-x-2 py-2">
            <div className="space-y-0.5">
              <Label>Public Visibility</Label>
              <p className="text-xs text-muted-foreground">Allow anyone to discover and join your workspace</p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={updateWorkspace.isPending}>
            {updateWorkspace.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Business & Presence</CardTitle>
          </div>
          <CardDescription>Configure how your business appears to customers and the public</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customDomain">Custom Domain</Label>
              <Input
                id="customDomain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="chat.acme.com"
              />
              <p className="text-xs text-muted-foreground">Host the platform on your own domain</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Branding & Customization</CardTitle>
          </div>
          <CardDescription>Customize the look and feel of your workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 p-1 h-10"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 p-1 h-10"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>Configure timezone, language, and date format preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (GMT-6)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (GMT-7)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai (GMT+8)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (GMT+10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                <SelectItem value="DD MMM YYYY">DD MMM YYYY (31 Dec 2024)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
