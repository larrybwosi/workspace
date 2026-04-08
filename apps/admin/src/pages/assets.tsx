import * as React from "react"
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Upload,
  Sparkles,
  Users,
  MoreHorizontal,
  Shield,
  Crown,
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
  Loader2,
} from "lucide-react"
import { Button } from "@repo/ui/ui/button"
import { Input } from "@repo/ui/ui/input"
import { Label } from "@repo/ui/ui/label"
import { Badge } from "@repo/ui/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/ui/tabs"
import { ScrollArea } from "@repo/ui/ui/scroll-area"
import { Switch } from "@repo/ui/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/ui/avatar"
import { TopBar } from "@repo/ui/layout/top-bar"
import { AdminSidebar } from "@repo/ui/layout/admin-sidebar"
import { toast } from "sonner"
import {
    useAdminAssets,
    useCreateAdminAsset,
    useUpdateAdminAsset,
    useDeleteAdminAsset,
    useAdminUpload
} from "@repo/api-client"
import { useWorkspaces } from "@repo/api-client"

type AssetType = "emoji" | "sticker" | "sound" | "profile_asset"

export function AdminAssetsPage() {
  const [activeTab, setActiveTab] = React.useState<AssetType>("profile_asset")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingAsset, setEditingAsset] = React.useState<any>(null)

  const { data: assets = [], isLoading: loading } = useAdminAssets(activeTab)
  const { data: workspaces = [] } = useWorkspaces()

  const createMutation = useCreateAdminAsset()
  const updateMutation = useUpdateAdminAsset()
  const deleteMutation = useDeleteAdminAsset()
  const uploadMutation = useAdminUpload()

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
      const dataToSave = { ...formData }
      if (activeTab === 'emoji') {
        dataToSave.imageUrl = dataToSave.imageUrl || dataToSave.url
      } else {
        dataToSave.url = dataToSave.url || dataToSave.imageUrl
      }

      if (editingAsset) {
        await updateMutation.mutateAsync({
          type: activeTab,
          id: editingAsset.id,
          data: dataToSave
        })
        toast.success("Asset updated successfully")
      } else {
        await createMutation.mutateAsync({
          type: activeTab,
          data: dataToSave
        })
        toast.success("Asset created successfully")
      }

      setIsDialogOpen(false)
    } catch (error) {
      toast.error("Error saving asset")
    }
  }

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return

    try {
      await deleteMutation.mutateAsync({ type: activeTab, id })
      toast.success("Asset deleted")
    } catch (error) {
      toast.error("Error deleting asset")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
          const res = await uploadMutation.mutateAsync(file)
          setFormData({
              ...formData,
              [activeTab === 'emoji' ? 'imageUrl' : 'url']: res.url
          })
          toast.success("File uploaded successfully")
      } catch (e) {
          toast.error("Failed to upload file")
      }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
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
                          <TableCell colSpan={6} className="text-center py-10">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                              <p className="mt-2 text-sm text-muted-foreground">Loading assets...</p>
                          </TableCell>
                        </TableRow>
                      ) : assets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">No assets found</TableCell>
                        </TableRow>
                      ) : (
                        assets
                          .filter((a: any) => a.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((asset: any) => (
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
                  <Label>Asset File</Label>
                  <div className="flex gap-2">
                    <Input
                      value={activeTab === 'emoji' ? (formData.imageUrl || "") : (formData.url || "")}
                      readOnly
                      placeholder="Upload a file..."
                    />
                    <Button variant="outline" size="icon" className="relative overflow-hidden">
                        {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            disabled={uploadMutation.isPending}
                        />
                    </Button>
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
            <Button onClick={handleSaveAsset} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
