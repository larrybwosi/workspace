"use client"
import { Search, Filter, Users, Share, LayoutGrid, List, Table, Clock, MoreHorizontal, Plus, Calendar, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { KanbanBoard } from "./kanban-board"
import { ProjectOverview } from "./project-overview"
import { TaskCreateSheet } from "./task-create-sheet"
import { GanttChart } from "./gantt-chart"
import { SprintManagement } from "./sprint-management"
import { CalendarView } from "./calendar-view"
import { NotesView } from "./notes-view"
import { mockUsers } from "@/lib/mock-data"
import type { Task } from "@/lib/types"
import * as React from "react"
import { useTasks, useCreateTask } from "@/hooks/api/use-tasks"
import { ProjectSettingsSheet } from "./project-settings-sheet"
import { TaskListView } from "./task-list-view"

interface TaskManagementViewProps {
  onTaskClick?: (task: Task) => void
  projectId?: string
  onProjectClick?: () => void
}

export function TaskManagementView({ onTaskClick, projectId = "project-1", onProjectClick }: TaskManagementViewProps) {
  const { data: tasksData, isLoading: tasksLoading } = useTasks(projectId)
  const createTaskMutation = useCreateTask()

  const [taskCreateOpen, setTaskCreateOpen] = React.useState(false)
  const [defaultStatus, setDefaultStatus] = React.useState<Task["status"]>("todo")
  const [projectSettingsOpen, setProjectSettingsOpen] = React.useState(false)

  const handleCreateTask = (status: Task["status"]) => {
    setDefaultStatus(status)
    setTaskCreateOpen(true)
  }

  const handleSaveTask = async (taskData: Partial<Task>) => {
    // Just close the dialog - the mutation is handled inside TaskCreateSheet
    setTaskCreateOpen(false)
  }

  const tasks = tasksData || []

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
      <div className="px-6 py-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onProjectClick}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Team spaces</span>
              <span>›</span>
              <span className="text-foreground font-medium">Tasks</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-9 w-64 h-9" />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘F
              </kbd>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Tasks</h1>
            <p className="text-sm text-muted-foreground">Short description will be placed here</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {mockUsers.slice(0, 4).map((user) => (
                <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              ))}
              <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                +2
              </div>
            </div>
            <Button className="gap-2" onClick={() => handleCreateTask("todo")}>
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Invite Member
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="board">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Board
              </TabsTrigger>
              <TabsTrigger value="sprints">
                <Clock className="h-4 w-4 mr-2" />
                Sprints
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="table">
                <Table className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="settings">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h13M4 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                Group by
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                Sort
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="mt-6 h-[calc(100vh-280px)]">
            <ProjectOverview />
          </TabsContent>
          <TabsContent value="board" className="mt-6 h-[calc(100vh-280px)]">
            <KanbanBoard onTaskClick={onTaskClick} onCreateTask={handleCreateTask} />
          </TabsContent>
          <TabsContent value="list" className="mt-6 h-[calc(100vh-280px)]">
            <TaskListView onTaskClick={onTaskClick} />
          </TabsContent>
          <TabsContent value="sprints" className="mt-6">
            <SprintManagement />
          </TabsContent>
          <TabsContent value="table" className="mt-6">
            <div className="text-center text-muted-foreground py-12">Table view coming soon...</div>
          </TabsContent>
          <TabsContent value="timeline" className="mt-6">
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
          <TabsContent value="calendar" className="mt-6 h-[calc(100vh-280px)]">
            <CalendarView onTaskClick={onTaskClick} />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <ProjectSettingsSheet project={null} open={true} onOpenChange={() => {}} embedded={true} />
          </TabsContent>
          <TabsContent value="notes" className="mt-6 h-[calc(100vh-280px)]">
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
