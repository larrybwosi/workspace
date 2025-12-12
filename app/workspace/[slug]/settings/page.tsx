"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Building2,
  Users,
  Shield,
  CreditCard,
  Bell,
  Webhook,
  Settings,
  Key,
  Activity,
  Globe,
  Lock,
  Mail,
  Check,
  Copy,
  MoreHorizontal,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Crown,
  UserPlus,
  Search,
  Filter,
  ExternalLink,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { useWorkspace, useUpdateWorkspace } from "@/hooks/api/use-workspaces"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Mock data for enterprise features
const mockMembers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "owner",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    joinedAt: "2024-01-15",
    lastActive: "2 min ago",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "admin",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    joinedAt: "2024-02-20",
    lastActive: "1 hour ago",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "member",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "active",
    joinedAt: "2024-03-10",
    lastActive: "3 hours ago",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    role: "member",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "invited",
    joinedAt: "2024-06-01",
    lastActive: "Pending",
  },
]

const mockAuditLogs = [
  {
    id: "1",
    action: "member.invited",
    actor: "John Doe",
    target: "sarah@example.com",
    timestamp: "2024-06-01T10:30:00Z",
    ip: "192.168.1.1",
  },
  {
    id: "2",
    action: "settings.updated",
    actor: "Jane Smith",
    target: "Security settings",
    timestamp: "2024-05-28T14:20:00Z",
    ip: "192.168.1.2",
  },
  {
    id: "3",
    action: "project.created",
    actor: "Mike Johnson",
    target: "Q3 Marketing",
    timestamp: "2024-05-25T09:15:00Z",
    ip: "192.168.1.3",
  },
  {
    id: "4",
    action: "api_key.created",
    actor: "John Doe",
    target: "Production API Key",
    timestamp: "2024-05-20T11:45:00Z",
    ip: "192.168.1.1",
  },
]

const mockIntegrations = [
  { id: "1", name: "Slack", icon: "💬", status: "connected", description: "Post messages and receive notifications" },
  { id: "2", name: "GitHub", icon: "🐙", status: "connected", description: "Sync issues and pull requests" },
  { id: "3", name: "Jira", icon: "📋", status: "available", description: "Import and sync Jira issues" },
  { id: "4", name: "Google Calendar", icon: "📅", status: "available", description: "Sync events and meetings" },
  { id: "5", name: "Zapier", icon: "⚡", status: "available", description: "Connect with 5000+ apps" },
]

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const { data: workspace, isLoading } = useWorkspace(workspaceId)
  const updateWorkspace = useUpdateWorkspace(workspaceId)

  const [activeTab, setActiveTab] = React.useState("general")
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = React.useState(false)

  // Form states
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [icon, setIcon] = React.useState("")

  // Settings states
  const [settings, setSettings] = React.useState({
    allowPublicProjects: false,
    requireMfa: false,
    allowGuestAccess: true,
    defaultMemberRole: "member",
    sessionTimeout: "24",
    ipWhitelist: "",
    domainRestriction: "",
    auditLogRetention: "90",
    timezone: "UTC",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    notifyOnMemberJoin: true,
    notifyOnProjectCreate: true,
    weeklyDigest: true,
    securityAlerts: true,
  })

  React.useEffect(() => {
    if (workspace) {
      setName(workspace.name || "")
      setDescription(workspace.description || "")
      setIcon(workspace.icon || "")
    }
  }, [workspace])

  const handleSaveGeneral = async () => {
    try {
      await updateWorkspace.mutateAsync({ name, description, icon })
      toast.success("Workspace settings saved")
    } catch {
      toast.error("Failed to save settings")
    }
  }

  const sidebarItems = [
    { id: "general", label: "General", icon: Building2 },
    { id: "members", label: "Members", icon: Users },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Webhook },
    { id: "api", label: "API & Webhooks", icon: Key },
    { id: "audit", label: "Audit Logs", icon: Activity },
    { id: "advanced", label: "Advanced", icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">{workspace?.icon || workspace?.name?.charAt(0) || "W"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{workspace?.name || "Workspace"}</h2>
              <p className="text-xs text-muted-foreground">Settings</p>
            </div>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <nav className="p-2 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-8">
            {/* General Settings */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">General Settings</h1>
                  <p className="text-muted-foreground">Manage your workspace profile and preferences</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Workspace Profile</CardTitle>
                    <CardDescription>Update your workspace information visible to all members</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl">
                        {icon || name?.charAt(0) || "W"}
                      </div>
                      <div className="space-y-2">
                        <Label>Workspace Icon</Label>
                        <Input
                          value={icon}
                          onChange={(e) => setIcon(e.target.value)}
                          placeholder="Enter emoji or character"
                          className="w-32"
                          maxLength={2}
                        />
                        <p className="text-xs text-muted-foreground">Use an emoji or single character</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Workspace Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Organization"
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
                        <Input
                          value={`app.domain.com/${workspace?.slug || "workspace"}`}
                          disabled
                          className="bg-muted"
                        />
                        <Button variant="outline" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleSaveGeneral} disabled={updateWorkspace.isPending}>
                      {updateWorkspace.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Regional Settings</CardTitle>
                    <CardDescription>Configure timezone, language, and date format preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select
                          value={settings.timezone}
                          onValueChange={(v) => setSettings({ ...settings, timezone: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select
                          value={settings.language}
                          onValueChange={(v) => setSettings({ ...settings, language: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select
                        value={settings.dateFormat}
                        onValueChange={(v) => setSettings({ ...settings, dateFormat: v })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Members */}
            {activeTab === "members" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Team Members</h1>
                    <p className="text-muted-foreground">Manage who has access to this workspace</p>
                  </div>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Members ({mockMembers.length})</CardTitle>
                        <CardDescription>Workspace members and their roles</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search members..." className="pl-9 w-64" />
                        </div>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {member.name}
                                    {member.role === "owner" && <Crown className="h-3 w-3 text-amber-500" />}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{member.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  member.role === "owner"
                                    ? "default"
                                    : member.role === "admin"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {member.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={member.status === "active" ? "default" : "outline"}
                                className={member.status === "active" ? "bg-green-500" : ""}
                              >
                                {member.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{member.lastActive}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                                  <DropdownMenuItem>Change Role</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Member Permissions</CardTitle>
                    <CardDescription>Configure default permissions for workspace members</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Default Member Role</div>
                        <div className="text-sm text-muted-foreground">Role assigned to new members by default</div>
                      </div>
                      <Select
                        value={settings.defaultMemberRole}
                        onValueChange={(v) => setSettings({ ...settings, defaultMemberRole: v })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="guest">Guest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Allow Guest Access</div>
                        <div className="text-sm text-muted-foreground">Let external users access specific projects</div>
                      </div>
                      <Switch
                        checked={settings.allowGuestAccess}
                        onCheckedChange={(v) => setSettings({ ...settings, allowGuestAccess: v })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Security Settings</h1>
                  <p className="text-muted-foreground">Configure authentication and access controls</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Authentication
                    </CardTitle>
                    <CardDescription>Control how members authenticate to your workspace</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Require Two-Factor Authentication</div>
                        <div className="text-sm text-muted-foreground">
                          All members must enable 2FA to access workspace
                        </div>
                      </div>
                      <Switch
                        checked={settings.requireMfa}
                        onCheckedChange={(v) => setSettings({ ...settings, requireMfa: v })}
                      />
                    </div>
                    <Separator />
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
                          <SelectItem value="8">8 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="168">7 days</SelectItem>
                          <SelectItem value="720">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Access Controls
                    </CardTitle>
                    <CardDescription>Restrict access based on network or domain</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>IP Whitelist</Label>
                      <Textarea
                        value={settings.ipWhitelist}
                        onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                        placeholder="Enter IP addresses, one per line&#10;192.168.1.0/24&#10;10.0.0.1"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Leave empty to allow all IPs</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Domain Restriction</Label>
                      <Input
                        value={settings.domainRestriction}
                        onChange={(e) => setSettings({ ...settings, domainRestriction: e.target.value })}
                        placeholder="@company.com"
                      />
                      <p className="text-xs text-muted-foreground">Only allow members with this email domain</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      SSO Configuration
                    </CardTitle>
                    <CardDescription>Configure Single Sign-On for enterprise authentication</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">SAML 2.0 / SSO</div>
                          <div className="text-sm text-muted-foreground">Enterprise plan required</div>
                        </div>
                      </div>
                      <Badge variant="outline">Enterprise</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Billing */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Billing & Plans</h1>
                  <p className="text-muted-foreground">Manage your subscription and billing information</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {workspace?.plan === "enterprise"
                              ? "Enterprise"
                              : workspace?.plan === "pro"
                                ? "Pro"
                                : "Free"}{" "}
                            Plan
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {workspace?.plan === "free" ? "Limited features" : "Full access to all features"}
                          </div>
                        </div>
                      </div>
                      <Button>Upgrade Plan</Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Members Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mockMembers.length} / 10</div>
                      <Progress value={40} className="mt-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">2.4 GB / 10 GB</div>
                      <Progress value={24} className="mt-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">API Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12,450 / 50,000</div>
                      <Progress value={25} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Available Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        {
                          name: "Free",
                          price: "$0",
                          features: ["5 members", "3 projects", "1GB storage", "Community support"],
                        },
                        {
                          name: "Pro",
                          price: "$12",
                          features: [
                            "25 members",
                            "Unlimited projects",
                            "50GB storage",
                            "Priority support",
                            "Advanced analytics",
                          ],
                        },
                        {
                          name: "Enterprise",
                          price: "Custom",
                          features: [
                            "Unlimited members",
                            "Unlimited projects",
                            "Unlimited storage",
                            "24/7 support",
                            "SSO/SAML",
                            "Custom integrations",
                            "SLA guarantee",
                          ],
                        },
                      ].map((plan) => (
                        <Card key={plan.name} className={cn(plan.name === "Pro" && "border-primary")}>
                          <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <div className="text-2xl font-bold">
                              {plan.price}
                              <span className="text-sm font-normal text-muted-foreground">/mo per user</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2 text-sm">
                                  <Check className="h-4 w-4 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                          <CardFooter>
                            <Button variant={plan.name === "Pro" ? "default" : "outline"} className="w-full">
                              {plan.name === "Enterprise" ? "Contact Sales" : "Select Plan"}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Notification Settings</h1>
                  <p className="text-muted-foreground">Configure workspace-wide notification preferences</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity Notifications</CardTitle>
                    <CardDescription>Choose which activities trigger workspace notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        key: "notifyOnMemberJoin",
                        label: "Member Joins",
                        description: "Notify admins when a new member joins",
                      },
                      {
                        key: "notifyOnProjectCreate",
                        label: "Project Created",
                        description: "Notify when a new project is created",
                      },
                      {
                        key: "weeklyDigest",
                        label: "Weekly Digest",
                        description: "Send weekly activity summary to all members",
                      },
                      {
                        key: "securityAlerts",
                        label: "Security Alerts",
                        description: "Notify admins of suspicious activity",
                      },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                        <Switch
                          checked={settings[item.key as keyof typeof settings] as boolean}
                          onCheckedChange={(v) => setSettings({ ...settings, [item.key]: v })}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Integrations */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Integrations</h1>
                  <p className="text-muted-foreground">Connect your workspace with external services</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {mockIntegrations.map((integration) => (
                    <Card key={integration.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                              {integration.icon}
                            </div>
                            <div>
                              <div className="font-semibold">{integration.name}</div>
                              <div className="text-sm text-muted-foreground">{integration.description}</div>
                            </div>
                          </div>
                          {integration.status === "connected" ? (
                            <Badge className="bg-green-500">Connected</Badge>
                          ) : (
                            <Button size="sm">Connect</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* API & Webhooks */}
            {activeTab === "api" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">API & Webhooks</h1>
                    <p className="text-muted-foreground">Manage API keys and webhook endpoints</p>
                  </div>
                  <Button onClick={() => router.push("/integrations")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open API Dashboard
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Access</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto py-4 justify-start bg-transparent"
                      onClick={() => router.push("/integrations")}
                    >
                      <Key className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">API Keys</div>
                        <div className="text-xs text-muted-foreground">Manage API access tokens</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 justify-start bg-transparent"
                      onClick={() => router.push("/integrations")}
                    >
                      <Webhook className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Webhooks</div>
                        <div className="text-xs text-muted-foreground">Configure webhook endpoints</div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Audit Logs */}
            {activeTab === "audit" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Audit Logs</h1>
                    <p className="text-muted-foreground">Track all activity in your workspace</p>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Activity</CardTitle>
                      <Select defaultValue="7">
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Last 24 hours</SelectItem>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Actor</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockAuditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{log.actor}</TableCell>
                            <TableCell className="text-muted-foreground">{log.target}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">{log.ip}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Log Retention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Audit Log Retention Period</div>
                        <div className="text-sm text-muted-foreground">How long to keep audit logs</div>
                      </div>
                      <Select
                        value={settings.auditLogRetention}
                        onValueChange={(v) => setSettings({ ...settings, auditLogRetention: v })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Advanced */}
            {activeTab === "advanced" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Advanced Settings</h1>
                  <p className="text-muted-foreground">Configure advanced workspace options</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Export Workspace Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Transfer Ownership</div>
                        <div className="text-sm text-muted-foreground">Transfer this workspace to another admin</div>
                      </div>
                      <Button variant="outline" onClick={() => setTransferDialogOpen(true)}>
                        Transfer
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                      <div>
                        <div className="font-medium text-destructive">Delete Workspace</div>
                        <div className="text-sm text-muted-foreground">
                          Permanently delete this workspace and all data
                        </div>
                      </div>
                      <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>Invite new members to join your workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <Textarea placeholder="Enter email addresses, one per line" rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue="member">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Personal Message (optional)</Label>
              <Textarea placeholder="Add a personal note to your invitation..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Send Invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workspace and all associated projects,
              channels, and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
