"use client"

import * as React from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { InfoPanel } from "@/components/info-panel"
import { ThreadView } from "@/components/thread-view"
import { SearchView } from "@/components/search-view"
import { MembersPanel } from "@/components/members-panel"
import { TaskManagementView } from "@/components/task-management-view"
import { TaskDetailSheet } from "@/components/task-detail-sheet"
import { TaskCreateEditDialog } from "@/components/task-create-edit-dialog"
import { ProjectDetailSheet } from "@/components/project-detail-sheet" 
import { AssistantChannel } from "@/components/assistant-channel"
import { DynamicHeader } from "@/components/dynamic-header"
import { ProjectSettingsSheet } from "@/components/project-settings-sheet" 
import { mockUsers, mockProjects } from "@/lib/mock-data"
import type { Task, Project } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = React.useState(false)
  const [activeChannel, setActiveChannel] = React.useState('')
  const [searchMode, setSearchMode] = React.useState(false)
  const [membersMode, setMembersMode] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [taskSheetOpen, setTaskSheetOpen] = React.useState(false)
  const [taskCreateEditOpen, setTaskCreateEditOpen] = React.useState(false)
  const [taskEditMode, setTaskEditMode] = React.useState<"create" | "edit">("create")
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  const [projectSheetOpen, setProjectSheetOpen] = React.useState(false)
  const [projectSettingsOpen, setProjectSettingsOpen] = React.useState(false) // Added project settings open state
  const [tasks, setTasks] = React.useState<Task[]>([])

  // useEffect(() => {
  //   router.push("/channels/uikit")
  // }, [router])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setTaskSheetOpen(true)
  }

  const handleProjectClick = (projectId: string) => {
    const project = mockProjects.find((p) => p.id === projectId)
    if (project) {
      setSelectedProject(project)
      setProjectSheetOpen(true)
    }
  }

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (taskEditMode === "create") {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title || "",
        description: taskData.description || "",
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        assignees: taskData.assignees || [],
        dueDate: taskData.dueDate || new Date(),
        linkedChannels: taskData.linkedChannels || [],
        linkedMessages: taskData.linkedMessages || [],
        comments: 0,
        links: 0,
        progress: { completed: 0, total: 3 },
      }
      setTasks([...tasks, newTask])
    } else {
      setTasks(tasks.map((t) => (t.id === taskData.id ? ({ ...t, ...taskData } as Task) : t)))
    }
  }

  const getDMUser = () => {
    if (activeChannel?.startsWith("dm-")) {
      const userId = activeChannel?.replace("dm-", "")
      return mockUsers.find((u) => u.id === userId)
    }
    return null
  }

  const renderMainContent = () => {
    if (activeChannel === "assistant") {
      return <AssistantChannel />
    }

    if (searchMode) {
      return <SearchView onClose={() => setSearchMode(false)} />
    }

    if (membersMode) {
      return <MembersPanel />
    }

    if (activeChannel?.startsWith("project-")) {
      return (
        <TaskManagementView
          onTaskClick={handleTaskClick}
          projectId={activeChannel}
          onProjectClick={handleProjectClick}
        />
      )
    }

    if (activeChannel?.startsWith("dm-")) {
      const dmUser = getDMUser()
      return (
        <ThreadView
          thread={{
            id: activeChannel,
            title: dmUser?.name || "Direct Message",
            channelId: activeChannel,
            messages: [],
            creator: mockUsers[0].id,
            dateCreated: new Date(),
            status: "Active",
            tags: [],
            tasks: 0,
            linkedThreads: [],
            members: [mockUsers[0].id, dmUser?.id || ""],
          }}
        />
      )
    }

    return <ThreadView />
  }

  const shouldShowInfoPanel = !activeChannel?.startsWith("project-") && activeChannel !== "assistant"

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
        onMembersClick={() => {
          setMembersMode(true)
          setSearchMode(false)
          setSidebarOpen(false)
        }}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <DynamicHeader
          activeView={activeChannel}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {
            setSearchMode(true)
            setMembersMode(false)
          }}
          onBackClick={activeChannel?.startsWith("project-") ? () => setActiveChannel("uikit") : undefined}
        />

        {renderMainContent()}

        {shouldShowInfoPanel && (
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-4 right-4 lg:hidden h-12 w-12 rounded-full shadow-lg"
            onClick={() => setInfoPanelOpen(true)}
          >
            <Info className="h-5 w-5" />
          </Button>
        )}
      </main>
      {shouldShowInfoPanel && <InfoPanel isOpen={infoPanelOpen} onClose={() => setInfoPanelOpen(false)} />}
      <TaskDetailSheet task={selectedTask} open={taskSheetOpen} onOpenChange={setTaskSheetOpen} />
      <ProjectDetailSheet project={selectedProject} open={projectSheetOpen} onOpenChange={setProjectSheetOpen} />
      <ProjectSettingsSheet
        project={selectedProject}
        open={projectSettingsOpen}
        onOpenChange={setProjectSettingsOpen}
      />{" "}
      {/* Added ProjectSettingsSheet */}
      <TaskCreateEditDialog
        open={taskCreateEditOpen}
        onOpenChange={setTaskCreateEditOpen}
        task={selectedTask}
        onSave={handleSaveTask}
        mode={taskEditMode}
      />
    </div>
  )
}
