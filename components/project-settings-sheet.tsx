"use client"

import * as React from "react"
import { Settings, Palette, Shield, Trash2, Archive, Calendar, GitBranch, Zap, Layout, Code, Save, AlertTriangle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import type { Project } from "@/lib/types"
import { useUpdateProjectSettings } from "@/hooks/api/use-projects"
import { toast } from "sonner"

interface ProjectSettingsSheetProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  embedded?: boolean // Add embedded prop to render as tab content
}

export function ProjectSettingsSheet({ project, open, onOpenChange, embedded = false }: ProjectSettingsSheetProps) {
  const [projectName, setProjectName] = React.useState(project?.name || "")
  const [projectDescription, setProjectDescription] = React.useState(project?.description || "")
  const [projectIcon, setProjectIcon] = React.useState(project?.icon || "📁")
  const [projectStatus, setProjectStatus] = React.useState(project?.status || "active")
  const [startDate, setStartDate] = React.useState(
    project?.startDate ? new Date(project.startDate).toISOString().split("T")[0] : ""
  )
  const [endDate, setEndDate] = React.useState(
    project?.endDate ? new Date(project.endDate).toISOString().split("T")[0] : ""
  )
  const [autoAssign, setAutoAssign] = React.useState(true)
  const [autoCloseSprints, setAutoCloseSprints] = React.useState(true)
  const [sendDailySummaries, setSendDailySummaries] = React.useState(false)
  const [notifications, setNotifications] = React.useState(true)
  const [publicAccess, setPublicAccess] = React.useState(false)
  const [primaryColor, setPrimaryColor] = React.useState("#3b82f6")
  const [accentColor, setAccentColor] = React.useState("#8b5cf6")
  const [defaultView, setDefaultView] = React.useState<string>("board")
  const [taskGrouping, setTaskGrouping] = React.useState<string>("status")
  const [customStatuses, setCustomStatuses] = React.useState([
    { id: "1", name: "To Do", color: "#94a3b8" },
    { id: "2", name: "In Progress", color: "#3b82f6" },
    { id: "3", name: "Done", color: "#22c55e" },
  ])

  const [requireApproval, setRequireApproval] = React.useState(false)
  const [allowGuestAccess, setAllowGuestAccess] = React.useState(false)
  const [enableTimeTracking, setEnableTimeTracking] = React.useState(true)
  const [enableBudgetTracking, setEnableBudgetTracking] = React.useState(false)
  const [budgetLimit, setBudgetLimit] = React.useState("")
  const [riskLevel, setRiskLevel] = React.useState<string>("low")
  const [clientName, setClientName] = React.useState("")
  const [enableSlackNotifications, setEnableSlackNotifications] = React.useState(false)
  const [enableEmailDigests, setEnableEmailDigests] = React.useState(true)
  const [autoArchiveDays, setAutoArchiveDays] = React.useState("30")

  const updateSettings = useUpdateProjectSettings()

  React.useEffect(() => {
    if (project) {
      setProjectName(project.name || "")
      setProjectDescription(project.description || "")
      setProjectIcon(project.icon || "📁")
      setProjectStatus(project.status || "active")
      setStartDate(project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "")
      setEndDate(project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "")
    }
  }, [project])

  const handleStatusNameChange = (id: string, newName: string) => {
    setCustomStatuses((prev) => prev.map((status) => (status.id === id ? { ...status, name: newName } : status)))
  }

  const handleStatusColorChange = (id: string, newColor: string) => {
    setCustomStatuses((prev) => prev.map((status) => (status.id === id ? { ...status, color: newColor } : status)))
  }

  const handleSave = async () => {
    if (!project?.id) return

    try {
      await updateSettings.mutateAsync({
        projectId: project.id,
        name: projectName,
        icon: projectIcon,
        description: projectDescription,
        status: projectStatus,
        customStatuses,
        autoAssign,
        autoCloseSprints,
        sendDailySummaries,
        notifications,
        publicAccess,
        primaryColor,
        accentColor,
        defaultView,
        taskGrouping,
        requireApproval,
        allowGuestAccess,
        enableTimeTracking,
        enableBudgetTracking,
        budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined,
        riskLevel,
        clientName,
        enableSlackNotifications,
        enableEmailDigests,
        autoArchiveCompletedTasks: autoArchiveDays ? parseInt(autoArchiveDays) : undefined,
      })
      toast.success("Settings saved successfully")
      onOpenChange(false)
    } catch (error) {
      console.error(" Error saving settings:", error)
      toast.error("Failed to save settings")
    }
  }

  const handleDelete = async () => {
    if (!project?.id) return
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return

    try {
      await fetch(`/api/projects/${project.id}`, { method: "DELETE" })
      toast.success("Project deleted successfully")
      onOpenChange(false)
      window.location.href = "/projects"
    } catch (error) {
      console.error(" Error deleting project:", error)
      toast.error("Failed to delete project")
    }
  }

  const handleArchive = async () => {
    if (!project?.id) return
    if (!confirm("Are you sure you want to archive this project?")) return

    try {
      await fetch(`/api/projects/${project.id}/archive`, { method: "POST" })
      toast.success("Project archived successfully")
      onOpenChange(false)
    } catch (error) {
      console.error(" Error archiving project:", error)
      toast.error("Failed to archive project")
    }
  }

  const settingsContent = (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="w-full justify-start mb-6">
        <TabsTrigger value="general" className="gap-2">
          <Settings className="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="workflow" className="gap-2">
          <GitBranch className="h-4 w-4" />
          Workflow
        </TabsTrigger>
        <TabsTrigger value="automation" className="gap-2">
          <Zap className="h-4 w-4" />
          Automation
        </TabsTrigger>
        <TabsTrigger value="theme" className="gap-2">
          <Palette className="h-4 w-4" />
          Theme
        </TabsTrigger>
        <TabsTrigger value="advanced" className="gap-2">
          <Code className="h-4 w-4" />
          Advanced
        </TabsTrigger>
        <TabsTrigger value="enterprise" className="gap-2">
          <Shield className="h-4 w-4" />
          Enterprise
        </TabsTrigger>
      </TabsList>

      {/* General Settings */}
      <TabsContent value="general" className="space-y-6 mt-0">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-icon">Project Icon</Label>
              <div className="flex items-center gap-2">
                <div className="text-4xl">{projectIcon}</div>
                <Input
                  id="project-icon"
                  value={projectIcon}
                  onChange={(e) => setProjectIcon(e.target.value)}
                  placeholder="📁"
                  className="w-24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-status">Project Status</Label>
              <Select value={projectStatus} onValueChange={setProjectStatus}>
                <SelectTrigger id="project-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Access & Permissions
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Access</Label>
                <p className="text-sm text-muted-foreground">Allow anyone in workspace to view</p>
              </div>
              <Switch checked={publicAccess} onCheckedChange={setPublicAccess} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates for this project</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input 
                id="start-date" 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input 
                id="end-date" 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </TabsContent>

      {/* Workflow Settings */}
      <TabsContent value="workflow" className="space-y-6 mt-0">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Custom Statuses</h3>
          <p className="text-sm text-muted-foreground mb-4">Define custom statuses for your project workflow</p>
          <div className="space-y-2">
            {customStatuses.map((status) => (
              <div key={status.id} className="flex items-center gap-3 p-2 rounded-lg border">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: status.color }} />
                <Input
                  value={status.name}
                  onChange={(e) => handleStatusNameChange(status.id, e.target.value)}
                  className="flex-1 h-8"
                />
                <Input
                  type="color"
                  value={status.color}
                  onChange={(e) => handleStatusColorChange(status.id, e.target.value)}
                  className="w-16 h-8"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Add Status
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Task Templates</h3>
          <p className="text-sm text-muted-foreground mb-4">Create reusable task templates</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Bug Report Template</p>
                <p className="text-sm text-muted-foreground">Standard bug report with required fields</p>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Feature Request Template</p>
                <p className="text-sm text-muted-foreground">Template for new feature requests</p>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Create Template
            </Button>
          </div>
        </Card>
      </TabsContent>

      {/* Automation Settings */}
      <TabsContent value="automation" className="space-y-6 mt-0">
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation Rules
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-assign tasks</Label>
                <p className="text-sm text-muted-foreground">Automatically assign tasks to team members</p>
              </div>
              <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-close completed sprints</Label>
                <p className="text-sm text-muted-foreground">Close sprints when all tasks are done</p>
              </div>
              <Switch checked={autoCloseSprints} onCheckedChange={setAutoCloseSprints} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send daily summaries</Label>
                <p className="text-sm text-muted-foreground">Email daily progress reports to team</p>
              </div>
              <Switch checked={sendDailySummaries} onCheckedChange={setSendDailySummaries} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Custom Automations</h3>
          <p className="text-sm text-muted-foreground mb-4">Create custom automation rules</p>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary">Active</Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-medium mb-1">When task is marked as done</p>
              <p className="text-sm text-muted-foreground">→ Send notification to assignee and watchers</p>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Create Automation
            </Button>
          </div>
        </Card>
      </TabsContent>

      {/* Theme Settings */}
      <TabsContent value="theme" className="space-y-6 mt-0">
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Project Colors
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Layout className="h-4 w-4" />
            View Preferences
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select value={defaultView} onValueChange={setDefaultView}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="board">Board</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Task Grouping</Label>
              <Select value={taskGrouping} onValueChange={setTaskGrouping}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">By Status</SelectItem>
                  <SelectItem value="assignee">By Assignee</SelectItem>
                  <SelectItem value="priority">By Priority</SelectItem>
                  <SelectItem value="sprint">By Sprint</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </TabsContent>

      {/* Advanced Settings */}
      <TabsContent value="advanced" className="space-y-6 mt-0">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Integrations</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                  <Code className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">GitHub</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                  <Code className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Slack</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-red-200 dark:border-red-800">
          <h3 className="font-semibold mb-4 text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Archive Project</p>
                <p className="text-sm text-muted-foreground">Make project read-only</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-orange-500 text-orange-600 bg-transparent"
                onClick={handleArchive}
              >
                <Archive className="h-3 w-3 mr-1" />
                Archive
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Project</p>
                <p className="text-sm text-muted-foreground">Permanently delete this project</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-500 text-red-600 bg-transparent"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      </TabsContent>

      {/* Enterprise Settings */}
      <TabsContent value="enterprise" className="space-y-6 mt-0">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Enterprise Features</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Time Tracking</Label>
                <p className="text-sm text-muted-foreground">Track time spent on tasks</p>
              </div>
              <Switch checked={enableTimeTracking} onCheckedChange={setEnableTimeTracking} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Budget Tracking</Label>
                <p className="text-sm text-muted-foreground">Monitor project budget and costs</p>
              </div>
              <Switch checked={enableBudgetTracking} onCheckedChange={setEnableBudgetTracking} />
            </div>

            {enableBudgetTracking && (
              <div className="space-y-2 pl-4">
                <Label htmlFor="budget-limit">Budget Limit ($)</Label>
                <Input
                  id="budget-limit"
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="Enter budget limit"
                />
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Approval</Label>
                <p className="text-sm text-muted-foreground">Tasks require manager approval</p>
              </div>
              <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Guest Access</Label>
                <p className="text-sm text-muted-foreground">Allow external collaborators</p>
              </div>
              <Switch checked={allowGuestAccess} onCheckedChange={setAllowGuestAccess} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Project Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-level">Risk Level</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger id="risk-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Advanced Automation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Slack Notifications</Label>
                <p className="text-sm text-muted-foreground">Send updates to Slack channel</p>
              </div>
              <Switch checked={enableSlackNotifications} onCheckedChange={setEnableSlackNotifications} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Digests</Label>
                <p className="text-sm text-muted-foreground">Daily email summaries to team</p>
              </div>
              <Switch checked={enableEmailDigests} onCheckedChange={setEnableEmailDigests} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="auto-archive">Auto-archive completed tasks</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="auto-archive"
                  type="number"
                  value={autoArchiveDays}
                  onChange={(e) => setAutoArchiveDays(e.target.value)}
                  placeholder="30"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days after completion</span>
              </div>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  )

  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{projectIcon}</div>
            <div>
              <h2 className="text-lg font-semibold">Project Settings</h2>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>
          <Button className="gap-2" onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4" />
            {updateSettings.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        <Separator />
        {settingsContent}
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{projectIcon}</div>
            <div>
              <SheetTitle>Project Settings</SheetTitle>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">{settingsContent}</div>
        </ScrollArea>

        <div className="p-4 border-t flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4" />
            {updateSettings.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
