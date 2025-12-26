"use client"
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Clock,
  MoreHorizontal,
  Calendar,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Task } from "@/lib/types"
import * as React from "react"
import { useTasks, useCreateTask } from "@/hooks/api/use-tasks"
import { TaskListView } from "./task-list-view"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectOverview } from "../projects/project-overview"
import { KanbanBoard } from "../projects/kanban-board"
import { SprintManagement } from "../projects/sprint-management"
import { GanttChart } from "../projects/gantt-chart"
import { CalendarView } from "../calendar/calendar-view"
import { NotesView } from "@/components/notes-view"
import { TaskCreateSheet } from "./task-create-sheet"

interface TaskManagementViewProps {
  onTaskClick?: (task: Task) => void
  projectId?: string
  onProjectClick?: () => void
}

export function TaskManagementView({ onTaskClick, projectId = "project-1", onProjectClick }: TaskManagementViewProps) {
  const { data: tasksData, isLoading: tasksLoading, refetch } = useTasks(projectId)
  const createTaskMutation = useCreateTask()

  const [taskCreateOpen, setTaskCreateOpen] = React.useState(false)
  const [defaultStatus, setDefaultStatus] = React.useState<Task["status"]>("todo")
  const [projectSettingsOpen, setProjectSettingsOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("board")
  const [searchQuery, setSearchQuery] = React.useState("")

  const handleCreateTask = (status: Task["status"]) => {
    setDefaultStatus(status)
    setTaskCreateOpen(true)
  }

  const handleSaveTask = async (taskData: Partial<Task>) => {
    setTaskCreateOpen(false)
  }

  const tasks = tasksData || []

  const filteredTasks = React.useMemo(() => {
    if (!searchQuery) return tasks
    const query = searchQuery.toLowerCase()
    return tasks.filter(
      (task) => task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query),
    )
  }, [tasks, searchQuery])

  if (tasksLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
                <LayoutGrid className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="board" className="gap-2 data-[state=active]:bg-background">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Board
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-background">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2 data-[state=active]:bg-background">
                <Clock className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-background">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="sprints" className="gap-2 data-[state=active]:bg-background">
                <RefreshCw className="h-4 w-4" />
                Sprints
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2 data-[state=active]:bg-background">
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-9 w-48 h-9 bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>All Tasks</DropdownMenuItem>
                  <DropdownMenuItem>My Tasks</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>High Priority</DropdownMenuItem>
                  <DropdownMenuItem>Due This Week</DropdownMenuItem>
                  <DropdownMenuItem>Overdue</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Tasks
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Import Tasks</DropdownMenuItem>
                  <DropdownMenuItem>Bulk Edit</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="overview" className="mt-4 h-[calc(100vh-320px)] overflow-auto">
            <ProjectOverview />
          </TabsContent>
          <TabsContent value="board" className="mt-4 h-[calc(100vh-320px)] overflow-auto">
            <KanbanBoard onTaskClick={onTaskClick} onCreateTask={handleCreateTask} />
          </TabsContent>
          <TabsContent value="list" className="mt-4 h-[calc(100vh-320px)] overflow-auto">
            <TaskListView onTaskClick={onTaskClick} />
          </TabsContent>
          <TabsContent value="sprints" className="mt-4 h-[calc(100vh-320px)] overflow-auto">
            <SprintManagement />
          </TabsContent>
          <TabsContent value="timeline" className="mt-4 h-[calc(100vh-320px)] overflow-auto">
            <GanttChart
              tasks={tasks.map((task) => ({
                ...task,
                startDate: task.startDate || new Date(),
                endDate: task.dueDate || new Date(),
                progress: task.progress?.completed || 0,
              }))}
              onTaskClick={onTaskClick}
            />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4 h-[calc(100vh-320px)] overflow-auto">
            <CalendarView onTaskClick={onTaskClick} />
          </TabsContent>
          <TabsContent value="notes" className="mt-4 h-[calc(100vh-320px)] overflow-auto">
            <NotesView />
          </TabsContent>
        </Tabs>
      </div>

      <TaskCreateSheet
        open={taskCreateOpen}
        onOpenChange={setTaskCreateOpen}
        task={null}
        onSave={handleSaveTask}
        mode="create"
        defaultStatus={defaultStatus}
        projectId={projectId}
      />
    </div>
  )
}
