"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit,
  Flag,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Goal {
  id: string
  title: string
  description: string
  targetDate: Date
  progress: number
  status: "on-track" | "at-risk" | "behind" | "completed"
  priority: "high" | "medium" | "low"
  keyResults: {
    id: string
    title: string
    target: number
    current: number
    unit: string
  }[]
}

interface ProjectGoalsPanelProps {
  projectId: string
}

export function ProjectGoalsPanel({ projectId }: ProjectGoalsPanelProps) {
  const [goals, setGoals] = React.useState<Goal[]>([
    {
      id: "1",
      title: "Launch MVP by Q4",
      description: "Complete and launch the minimum viable product",
      targetDate: new Date("2024-12-31"),
      progress: 65,
      status: "on-track",
      priority: "high",
      keyResults: [
        { id: "kr1", title: "Complete core features", target: 10, current: 7, unit: "features" },
        { id: "kr2", title: "User testing sessions", target: 20, current: 12, unit: "sessions" },
        { id: "kr3", title: "Bug fixes", target: 50, current: 35, unit: "bugs" },
      ],
    },
    {
      id: "2",
      title: "Improve team velocity",
      description: "Increase sprint completion rate",
      targetDate: new Date("2024-11-30"),
      progress: 80,
      status: "on-track",
      priority: "medium",
      keyResults: [
        { id: "kr4", title: "Sprint velocity", target: 40, current: 32, unit: "points" },
        { id: "kr5", title: "On-time delivery", target: 90, current: 85, unit: "%" },
      ],
    },
  ])

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [newGoal, setNewGoal] = React.useState({
    title: "",
    description: "",
    targetDate: "",
    priority: "medium" as "high" | "medium" | "low",
  })

  const handleCreateGoal = () => {
    if (!newGoal.title) return

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      targetDate: new Date(newGoal.targetDate),
      progress: 0,
      status: "on-track",
      priority: newGoal.priority,
      keyResults: [],
    }

    setGoals([...goals, goal])
    setNewGoal({ title: "", description: "", targetDate: "", priority: "medium" })
    setCreateDialogOpen(false)
    toast.success("Goal created successfully")
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter((g) => g.id !== goalId))
    toast.success("Goal deleted")
  }

  const getStatusColor = (status: Goal["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "on-track":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "at-risk":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "behind":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20"
    }
  }

  const getStatusIcon = (status: Goal["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "on-track":
        return <TrendingUp className="h-4 w-4" />
      case "at-risk":
        return <AlertTriangle className="h-4 w-4" />
      case "behind":
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: Goal["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600"
      case "medium":
        return "bg-amber-500/10 text-amber-600"
      case "low":
        return "bg-blue-500/10 text-blue-600"
      default:
        return "bg-slate-500/10 text-slate-600"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Project Goals & OKRs</h2>
          <p className="text-sm text-muted-foreground">Track objectives and key results</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Define a new objective for your project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="goal-title">Title</Label>
                <Input
                  id="goal-title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Launch MVP by Q4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-description">Description</Label>
                <Textarea
                  id="goal-description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Describe the goal..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-date">Target Date</Label>
                  <Input
                    id="goal-date"
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newGoal.priority}
                    onValueChange={(v) => setNewGoal({ ...newGoal, priority: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGoal}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{goals.length}</p>
              <p className="text-xs text-muted-foreground">Total Goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{goals.filter((g) => g.status === "completed").length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{goals.filter((g) => g.status === "on-track").length}</p>
              <p className="text-xs text-muted-foreground">On Track</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {goals.filter((g) => g.status === "at-risk" || g.status === "behind").length}
              </p>
              <p className="text-xs text-muted-foreground">At Risk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals list */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(goal.priority))}>
                        <Flag className="h-3 w-3 mr-1" />
                        {goal.priority}
                      </Badge>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("gap-1", getStatusColor(goal.status))}>
                      {getStatusIcon(goal.status)}
                      {goal.status.replace("-", " ")}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Edit className="h-4 w-4" />
                          Edit goal
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add key result
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteGoal(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                          Delete goal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due {goal.targetDate.toLocaleDateString()}
                    </span>
                  </div>
                  <span className="font-medium">{goal.progress}% complete</span>
                </div>
                <Progress value={goal.progress} className="h-2" />

                {/* Key Results */}
                {goal.keyResults.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium text-muted-foreground">Key Results</p>
                    {goal.keyResults.map((kr) => (
                      <div key={kr.id} className="flex items-center justify-between text-sm">
                        <span>{kr.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {kr.current}/{kr.target} {kr.unit}
                          </span>
                          <Progress value={(kr.current / kr.target) * 100} className="w-24 h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
