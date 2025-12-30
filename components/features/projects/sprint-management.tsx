"use client"

import * as React from "react"
import { Calendar, TrendingUp, TrendingDown, Plus, Play, Pause, CheckCircle2, Edit } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { mockUsers } from "@/lib/mock-data"
import type { Task } from "@/lib/types"
import { useParams } from 'next/navigation'
import { useProjectSprints, useCreateSprint, useUpdateSprint, useStartSprint, useEndSprint } from "@/hooks/api/use-projects"

interface Sprint {
  id: string
  name: string
  goal: string
  startDate: Date
  endDate: Date
  status: "planning" | "active" | "completed"
  tasks: Task[]
  velocity: number
  capacity: number
}

export function SprintManagement() {
  const params = useParams()
  const projectId = (params?.projectId as string) || "project-1"
  
  const { data: sprints = [], isLoading } = useProjectSprints(projectId)
  const createSprintMutation = useCreateSprint()
  const updateSprintMutation = useUpdateSprint()
  const startSprintMutation = useStartSprint()
  const endSprintMutation = useEndSprint()

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [selectedSprint, setSelectedSprint] = React.useState<Sprint | null>(null)
  const [editingSprint, setEditingSprint] = React.useState<Sprint | null>(null)
  const [sprintForm, setSprintForm] = React.useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
    capacity: "40",
  })

  const activeSprint = sprints.find((s) => s.status === "active")
  const upcomingSprints = sprints.filter((s) => s.status === "planning")
  const completedSprints = sprints.filter((s) => s.status === "completed")

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getSprintProgress = (sprint: Sprint) => {
    if (sprint.tasks.length === 0) return 0
    const completed = sprint.tasks.filter((t) => t.status === "done").length
    return (completed / sprint.tasks.length) * 100
  }

  const getBurndownData = (sprint: Sprint) => {
    const totalDays = Math.ceil((sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.ceil((new Date().getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      totalDays,
      daysElapsed,
      idealBurndown: sprint.velocity * (1 - daysElapsed / totalDays),
      actualBurndown: sprint.velocity - sprint.tasks.filter((t) => t.status === "done").length * 2,
    }
  }

  const handleSaveSprint = async () => {
    const sprintData = {
      name: sprintForm.name,
      goal: sprintForm.goal,
      startDate: new Date(sprintForm.startDate),
      endDate: new Date(sprintForm.endDate),
      capacity: Number.parseInt(sprintForm.capacity),
      projectId,
    }

    if (editingSprint) {
      await updateSprintMutation.mutateAsync({
        projectId,
        sprintId: editingSprint.id,
        ...sprintData,
      })
    } else {
      await createSprintMutation.mutateAsync({
        ...sprintData,
        status: "planning" as const,
        tasks: [],
        velocity: 0,
      })
    }
    
    setCreateDialogOpen(false)
    setEditingSprint(null)
    setSprintForm({ name: "", goal: "", startDate: "", endDate: "", capacity: "40" })
  }

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint)
    setSprintForm({
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate.toISOString().split("T")[0],
      endDate: sprint.endDate.toISOString().split("T")[0],
      capacity: sprint.capacity.toString(),
    })
    setCreateDialogOpen(true)
  }

  const handleStartSprint = async (sprintId: string) => {
    await startSprintMutation.mutateAsync({ projectId, sprintId })
  }

  const handleEndSprint = async (sprintId: string) => {
    await endSprintMutation.mutateAsync({ projectId, sprintId })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Sprint */}
      {activeSprint && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Active Sprint</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEditSprint(activeSprint)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleEndSprint(activeSprint.id)}>
                <Pause className="h-4 w-4 mr-2" />
                End Sprint
              </Button>
            </div>
          </div>

          <Card className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{activeSprint.name}</h3>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <Play className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <p className="text-muted-foreground">{activeSprint.goal}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {activeSprint.startDate.toLocaleDateString()} - {activeSprint.endDate.toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline">{getDaysRemaining(activeSprint.endDate)} days remaining</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{activeSprint.velocity}</p>
                <p className="text-xs text-muted-foreground">Story points</p>
              </Card>
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">18</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>56% complete</span>
                </div>
              </Card>
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">10</p>
                <p className="text-xs text-muted-foreground">31% of total</p>
              </Card>
              <Card className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">To Do</p>
                <p className="text-2xl font-bold text-gray-600">4</p>
                <p className="text-xs text-muted-foreground">13% remaining</p>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Sprint Progress</h4>
                <span className="text-sm text-muted-foreground">56% Complete</span>
              </div>
              <Progress value={56} className="h-3" />
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Burndown Chart</h4>
              <Card className="p-4 h-64 flex items-center justify-center bg-muted/30">
                <div className="text-center space-y-2">
                  <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Burndown chart visualization</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-8 bg-blue-500 rounded" />
                      <span>Ideal Burndown</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-8 bg-green-500 rounded" />
                      <span>Actual Progress</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {mockUsers.slice(0, 5).map((user) => (
                    <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">5 team members</span>
              </div>
              <Button variant="outline">View All Tasks</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Upcoming & Completed Sprints */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Sprints</TabsTrigger>
          <TabsTrigger value="completed">Completed Sprints</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upcoming Sprints</h3>
            <Button
              onClick={() => {
                setEditingSprint(null)
                setSprintForm({ name: "", goal: "", startDate: "", endDate: "", capacity: "40" })
                setCreateDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Sprint
            </Button>
          </div>
          {upcomingSprints.map((sprint) => (
            <Card key={sprint.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{sprint.name}</h4>
                    <Badge variant="outline">Planning</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{sprint.goal}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditSprint(sprint)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" onClick={() => handleStartSprint(sprint.id)}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Sprint
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedSprints.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No completed sprints yet</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedSprints.map((sprint) => (
                <Card key={sprint.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{sprint.name}</h4>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Completed
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{sprint.goal}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Report
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Sprint Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSprint ? "Edit Sprint" : "Create New Sprint"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Sprint Name</Label>
              <Input
                id="sprint-name"
                placeholder="Sprint 3"
                value={sprintForm.name}
                onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-goal">Sprint Goal</Label>
              <Textarea
                id="sprint-goal"
                placeholder="What do you want to achieve in this sprint?"
                className="min-h-[80px]"
                value={sprintForm.goal}
                onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={sprintForm.startDate}
                  onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={sprintForm.endDate}
                  onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Story Points)</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="40"
                value={sprintForm.capacity}
                onChange={(e) => setSprintForm({ ...sprintForm, capacity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSprint}>{editingSprint ? "Update Sprint" : "Create Sprint"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
