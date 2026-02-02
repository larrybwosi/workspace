"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Building2,
  Users,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Settings,
  Trash2,
  Edit,
  UserPlus,
  Megaphone,
  FolderTree,
  Search,
  Crown,
  Shield,
} from "lucide-react"

interface Department {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  parentId?: string
  managerId?: string
  children?: Department[]
  members?: any[]
  teams?: any[]
  _count?: { members: number; teams: number; announcements: number }
}

interface WorkspaceDepartmentsPanelProps {
  workspaceId: string
}

export function WorkspaceDepartmentsPanel({ workspaceId }: WorkspaceDepartmentsPanelProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [expandedDepts, setExpandedDepts] = React.useState<Set<string>>(new Set())

  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ["workspace-departments", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/departments`)
      if (!res.ok) throw new Error("Failed to fetch departments")
      return res.json()
    },
  })

  const createDepartment = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create department")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-departments", workspaceId] })
      setIsCreateOpen(false)
      toast.success("Department created successfully")
    },
    onError: () => {
      toast.error("Failed to create department")
    },
  })

  const deleteDepartment = useMutation({
    mutationFn: async (departmentId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/departments/${departmentId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete department")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-departments", workspaceId] })
      setSelectedDepartment(null)
      toast.success("Department deleted")
    },
  })

  const departments: Department[] = departmentsData?.departments || []

  // Build hierarchy
  const rootDepartments = departments.filter((d) => !d.parentId)

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedDepts)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedDepts(newExpanded)
  }

  const filteredDepartments = searchQuery
    ? departments.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : rootDepartments

  const renderDepartmentTree = (dept: Department, level = 0) => {
    const hasChildren = dept.children && dept.children.length > 0
    const isExpanded = expandedDepts.has(dept.id)

    return (
      <div key={dept.id} style={{ marginLeft: level * 16 }}>
        <div
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent ${
            selectedDepartment?.id === dept.id ? "bg-accent" : ""
          }`}
          onClick={() => setSelectedDepartment(dept)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(dept.id)
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: dept.color || "#6366f1" }}
          >
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{dept.name}</p>
            <p className="text-xs text-muted-foreground">{dept._count?.members || 0} members</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Members
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Megaphone className="h-4 w-4 mr-2" />
                Post Announcement
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => deleteDepartment.mutate(dept.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {dept.children!.map((child) => {
              const fullChild = departments.find((d) => d.id === child.id) || child
              return renderDepartmentTree(fullChild as Department, level + 1)
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Department List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Departments
            </h3>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Department</DialogTitle>
                  <DialogDescription>Add a new department to your organization structure.</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    createDepartment.mutate({
                      name: formData.get("name"),
                      slug: formData.get("slug"),
                      description: formData.get("description"),
                      color: formData.get("color"),
                      parentId: formData.get("parentId") || undefined,
                    })
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name</Label>
                    <Input id="name" name="name" placeholder="Engineering" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" name="slug" placeholder="engineering" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Optional description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input id="color" name="color" type="color" defaultValue="#6366f1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentId">Parent Department</Label>
                      <Select name="parentId">
                        <SelectTrigger>
                          <SelectValue placeholder="None (Root)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="root">None (Root)</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createDepartment.isPending}>
                      {createDepartment.isPending ? "Creating..." : "Create Department"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1 p-2">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : filteredDepartments.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No departments found</div>
          ) : (
            filteredDepartments.map((dept) => renderDepartmentTree(dept))
          )}
        </ScrollArea>
      </div>

      {/* Department Details */}
      <div className="flex-1 p-6">
        {selectedDepartment ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedDepartment.color || "#6366f1" }}
                >
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedDepartment.name}</h2>
                  <p className="text-muted-foreground">{selectedDepartment.description || "No description"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Announce
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedDepartment._count?.members || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedDepartment._count?.teams || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedDepartment._count?.announcements || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sub-departments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedDepartment.children?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="members">
              <TabsList>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
                <TabsTrigger value="announcements">Announcements</TabsTrigger>
              </TabsList>
              <TabsContent value="members" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Department Members</CardTitle>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Members
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedDepartment.members && selectedDepartment.members.length > 0 ? (
                        selectedDepartment.members.map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.user?.avatar || "/placeholder.svg"} />
                                <AvatarFallback>{member.user?.name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.user?.name}</p>
                                <p className="text-sm text-muted-foreground">{member.title || member.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {member.role === "owner" && (
                                <Badge variant="secondary">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Owner
                                </Badge>
                              )}
                              {member.role === "admin" && (
                                <Badge variant="outline">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No members in this department</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="teams" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Teams</CardTitle>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDepartment.teams && selectedDepartment.teams.length > 0 ? (
                        selectedDepartment.teams.map((team: any) => (
                          <Card key={team.id} className="cursor-pointer hover:bg-accent/50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                  style={{ backgroundColor: team.color || "#10b981" }}
                                >
                                  <Users className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{team.name}</p>
                                  <p className="text-sm text-muted-foreground">{team._count?.members || 0} members</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="col-span-2 text-center text-muted-foreground py-8">No teams in this department</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="announcements" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Announcements</CardTitle>
                      <Button size="sm">
                        <Megaphone className="h-4 w-4 mr-2" />
                        New Announcement
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground py-8">No announcements yet</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a department to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
