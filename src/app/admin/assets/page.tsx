"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Upload,
  Sparkles,
  Award,
  Users,
  MoreHorizontal,
  Shield,
  Star,
  Crown,
  Zap,
  Heart,
  Trophy,
  Sticker,
  Volume2,
  Layout,
  BarChart3,
  Clock,
  MessageSquare,
  Lock,
  Globe,
  Settings,
  Building2,
  Palette,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TopBar } from "@/components/layout/top-bar"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type AssetType = "emoji" | "sticker" | "sound" | "profile_asset"

export default function AdminAssetsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<AssetType>("profile_asset")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [assets, setAssets] = React.useState<any[]>([])
  const [workspaces, setWorkspaces] = React.useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingAsset, setEditingAsset] = React.useState<any>(null)
  const [statsDialogOpen, setStatsDialogOpen] = React.useState(false)
  const [currentStats, setCurrentStats] = React.useState<any[]>([])
  const [statsLoading, setStatsLoading] = React.useState(false)

  // Form State
  const [formData, setFormData] = React.useState<any>({
    name: "",
    url: "",
    imageUrl: "",
    type: "avatar",
    shortcode: "",
    volume: 1.0,
    emoji: "",
    animated: false,
    isGlobal: true,
    category: "custom",
    workspaceId: null,
    themeColors: {
      primary: "#5865F2",
      accent: "#5865F2",
      background: "#313338"
    },
    rules: {
      requiredPlan: "free",
      requiredRole: "",
      requiredBadgeId: "",
      minMessages: 0,
      minAccountAgeDays: 0,
    }
  })

  const fetchAssets = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/assets?type=${activeTab}`)
      if (!res.ok) throw new Error("Failed to fetch assets")
      const data = await res.json()
      setAssets(data)
    } catch (error) {
      toast.error("Failed to load assets")
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("/api/workspaces")
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data)
      }
    } catch (e) {
      console.error("Failed to fetch workspaces")
    }
  }

  React.useEffect(() => {
    fetchAssets()
    fetchWorkspaces()
  }, [fetchAssets])

  const handleOpenDialog = (asset: any = null) => {
    if (asset) {
      setEditingAsset(asset)
      setFormData({
        ...asset,
        themeColors: asset.themeColors || { primary: "#5865F2", accent: "#5865F2", background: "#313338" },
        rules: asset.rules || { requiredPlan: "free", requiredRole: "", requiredBadgeId: "", minMessages: 0, minAccountAgeDays: 0 }
      })
    } else {
      setEditingAsset(null)
      setFormData({
        name: "",
        url: "",
        imageUrl: "",
        type: activeTab === "profile_asset" ? "avatar" : "",
        shortcode: "",
        volume: 1.0,
        emoji: "",
        animated: false,
        isGlobal: true,
        category: "custom",
        workspaceId: null,
        themeColors: {
          primary: "#5865F2",
          accent: "#5865F2",
          background: "#313338"
        },
        rules: {
          requiredPlan: "free",
          requiredRole: "",
          requiredBadgeId: "",
          minMessages: 0,
          minAccountAgeDays: 0,
        }
      })
    }
    setIsDialogOpen(true)
  }

  const handleSaveAsset = async () => {
    try {
      // Ensure specific field consistency
      const dataToSave = { ...formData }
      if (activeTab === 'emoji') {
        dataToSave.imageUrl = dataToSave.imageUrl || dataToSave.url
      } else {
        dataToSave.url = dataToSave.url || dataToSave.imageUrl
      }

      const method = editingAsset ? "PATCH" : "POST"
      const res = await fetch("/api/admin/assets", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          id: editingAsset?.id,
          data: dataToSave
        })
      })

      if (!res.ok) throw new Error("Failed to save asset")

      toast.success(`Asset ${editingAsset ? "updated" : "created"} successfully`)
      setIsDialogOpen(false)
      fetchAssets()
    } catch (error) {
      toast.error("Error saving asset")
    }
  }

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return

    try {
      const res = await fetch(`/api/admin/assets?type=${activeTab}&id=${id}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete asset")

      toast.success("Asset deleted")
      fetchAssets()
    } catch (error) {
      toast.error("Error deleting asset")
    }
  }

  const handleShowStats = async (asset: any) => {
    setStatsLoading(true)
    setStatsDialogOpen(true)
    try {
      const res = await fetch(`/api/admin/assets/stats?assetId=${asset.id}&assetType=${activeTab}`)
      if (!res.ok) throw new Error("Failed to fetch stats")
      const data = await res.json()
      setCurrentStats(data)
    } catch (error) {
      toast.error("Failed to load statistics")
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel="admin-assets"
        onChannelSelect={() => {}}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          channelName="Asset Management"
          channelDescription="Manage custom profile pictures, banners, emojis, stickers and soundboard"
        />

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Layout className="h-8 w-8 text-primary" />
                  Premium Asset Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  Configure high-quality assets and define their eligibility rules for premium tiers
                </p>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add New {activeTab.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Global Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">Enterprise</div>
                  <p className="text-xs text-muted-foreground">Managing platform-wide assets</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Crown className="h-4 w-4" /> Premium Tier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Nitro</div>
                  <p className="text-xs text-muted-foreground">Standard for premium assets</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Enabled</div>
                  <p className="text-xs text-muted-foreground">Eligibility rules enforced</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Usage Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Active</div>
                  <p className="text-xs text-muted-foreground">Logging detailed analytics</p>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetType)} className="space-y-6">
              <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                <TabsTrigger value="profile_asset" className="gap-2">
                  <Users className="h-4 w-4" />
                  Profiles
                </TabsTrigger>
                <TabsTrigger value="emoji" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Emojis
                </TabsTrigger>
                <TabsTrigger value="sticker" className="gap-2">
                  <Sticker className="h-4 w-4" />
                  Stickers
                </TabsTrigger>
                <TabsTrigger value="sound" className="gap-2">
                  <Volume2 className="h-4 w-4" />
                  Soundboard
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${activeTab.replace('_', ' ')}s...`}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Preview</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Rules</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead className="text-center">Usage</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">Loading assets...</TableCell>
                        </TableRow>
                      ) : assets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">No assets found</TableCell>
                        </TableRow>
                      ) : (
                        assets
                          .filter(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell>
                              <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                {activeTab === "sound" ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-lg">{asset.emoji}</span>
                                    <Volume2 className="h-4 w-4 text-primary" />
                                  </div>
                                ) : asset.type === "theme" ? (
                                  <div className="h-full w-full flex items-center justify-center" style={{ background: asset.themeColors?.background }}>
                                    <div className="h-4 w-4 rounded-full" style={{ background: asset.themeColors?.primary }}></div>
                                  </div>
                                ) : (
                                  <img src={asset.url || asset.imageUrl} alt={asset.name} className="h-full w-full object-contain" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{asset.name}</div>
                                <div className="text-xs text-muted-foreground">{asset.shortcode || asset.type}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {asset.rules?.requiredPlan && asset.rules.requiredPlan !== "free" && (
                                  <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20 capitalize">
                                    {asset.rules.requiredPlan.replace('_', ' ')}
                                  </Badge>
                                )}
                                {asset.rules?.requiredRole && (
                                  <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> {asset.rules.requiredRole}
                                  </Badge>
                                )}
                                {asset.rules?.minMessages > 0 && (
                                  <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> {asset.rules.minMessages}+
                                  </Badge>
                                )}
                                {asset.rules?.minAccountAgeDays > 0 && (
                                  <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {asset.rules.minAccountAgeDays}d+
                                  </Badge>
                                )}
                                {!asset.rules || (asset.rules.requiredPlan === "free" && !asset.rules.minMessages && !asset.rules.minAccountAgeDays && !asset.rules.requiredRole) && (
                                  <span className="text-xs text-muted-foreground italic">None</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {asset.isGlobal ? (
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Global</Badge>
                              ) : (
                                <Badge variant="secondary" title={asset.workspaceId}>Workspace</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-mono font-medium">
                              {asset.usageCount || 0}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleShowStats(asset)}>
                                    <BarChart3 className="h-4 w-4 mr-2" /> View Stats
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenDialog(asset)}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAsset(asset.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Tabs>
          </div>
        </ScrollArea>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit" : "Add New"} {activeTab.replace('_', ' ')}</DialogTitle>
            <DialogDescription>
              Configure asset properties and eligibility rules. Premium assets are restricted to specific tiers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column: Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" /> Basic Configuration
              </h3>
              <div className="space-y-2">
                <Label>Asset Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cool Asset"
                />
              </div>

              {formData.type !== "theme" && (
                <div className="space-y-2">
                  <Label>URL / Source</Label>
                  <div className="flex gap-2">
                    <Input
                      value={activeTab === 'emoji' ? formData.imageUrl : formData.url}
                      onChange={(e) => setFormData({ ...formData, [activeTab === 'emoji' ? 'imageUrl' : 'url']: e.target.value })}
                      placeholder="https://..."
                    />
                    <Button variant="outline" size="icon"><Upload className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}

              {activeTab === "profile_asset" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Asset Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avatar">Avatar Decor</SelectItem>
                        <SelectItem value="banner">Profile Banner</SelectItem>
                        <SelectItem value="theme">Profile Theme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === "theme" && (
                    <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                      <div className="flex items-center gap-2 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                        <Palette className="h-3 w-3" /> Theme Colors
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Primary</Label>
                          <Input
                            type="color"
                            className="h-8 p-1"
                            value={formData.themeColors?.primary || "#5865F2"}
                            onChange={(e) => setFormData({
                              ...formData,
                              themeColors: { ...formData.themeColors, primary: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Accent</Label>
                          <Input
                            type="color"
                            className="h-8 p-1"
                            value={formData.themeColors?.accent || "#5865F2"}
                            onChange={(e) => setFormData({
                              ...formData,
                              themeColors: { ...formData.themeColors, accent: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Background</Label>
                          <Input
                            type="color"
                            className="h-8 p-1"
                            value={formData.themeColors?.background || "#313338"}
                            onChange={(e) => setFormData({
                              ...formData,
                              themeColors: { ...formData.themeColors, background: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "emoji" && (
                <div className="space-y-2">
                  <Label>Shortcode</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">:</span>
                    <Input
                      className="pl-6"
                      value={formData.shortcode}
                      onChange={(e) => setFormData({ ...formData, shortcode: e.target.value })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">:</span>
                  </div>
                </div>
              )}

              {activeTab === "sound" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Emoji</Label>
                    <Input
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      placeholder="🔊"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label>Volume (0.0 - 1.0)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Is Global Asset</Label>
                  <Switch
                    checked={formData.isGlobal}
                    onCheckedChange={(v) => setFormData({ ...formData, isGlobal: v, workspaceId: v ? null : formData.workspaceId })}
                  />
                </div>

                {!formData.isGlobal && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Building2 className="h-3 w-3" /> Assigned Workspace</Label>
                    <Select
                      value={formData.workspaceId || "none"}
                      onValueChange={(v) => setFormData({ ...formData, workspaceId: v === "none" ? null : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Pick a workspace</SelectItem>
                        {workspaces.map((w: any) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Animated</Label>
                  <Switch
                    checked={formData.animated}
                    onCheckedChange={(v) => setFormData({ ...formData, animated: v })}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Rules */}
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-muted-foreground/10">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" /> Eligibility Rules
              </h3>

              <div className="space-y-2">
                <Label>Required Plan</Label>
                <Select
                  value={formData.rules.requiredPlan}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, requiredPlan: v }
                  })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Everyone (Free)</SelectItem>
                    <SelectItem value="nitro_basic">Nitro Basic & Above</SelectItem>
                    <SelectItem value="nitro">Nitro Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Required Role</Label>
                <Input
                  className="bg-background"
                  value={formData.rules.requiredRole}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, requiredRole: e.target.value }
                  })}
                  placeholder="e.g. Moderator"
                />
              </div>

              <div className="space-y-2">
                <Label>Required Badge ID</Label>
                <Input
                  className="bg-background"
                  value={formData.rules.requiredBadgeId}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, requiredBadgeId: e.target.value }
                  })}
                  placeholder="ID of the badge"
                />
              </div>

              <div className="space-y-2">
                <Label>Min. Messages Sent</Label>
                <Input
                  type="number"
                  className="bg-background"
                  value={formData.rules.minMessages}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, minMessages: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Min. Account Age (Days)</Label>
                <Input
                  type="number"
                  className="bg-background"
                  value={formData.rules.minAccountAgeDays}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, minAccountAgeDays: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>

              <div className="pt-4 p-3 bg-primary/5 rounded border border-primary/10">
                 <p className="text-[11px] text-muted-foreground">
                   <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
                   Eligibility will be verified in real-time when the user attempts to use this asset.
                 </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAsset}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Usage Analytics</DialogTitle>
            <DialogDescription>
              Real-time tracking of asset utilization across the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <ScrollArea className="h-[400px] pr-4">
              {statsLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 animate-pulse" />
                  <p>Loading analytics data...</p>
                </div>
              ) : currentStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground opacity-50">
                  <Globe className="h-12 w-12" />
                  <p>No usage data recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentStats.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.user?.avatar || log.user?.image} />
                          <AvatarFallback>{log.user?.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{log.user?.name || "Unknown User"}</p>
                          <p className="text-[10px] text-muted-foreground">User ID: {log.userId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{new Date(log.usedAt).toLocaleString()}</p>
                        {log.workspaceId && <Badge variant="outline" className="text-[9px]">Local</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button onClick={() => setStatsDialogOpen(false)}>Close Analytics</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
