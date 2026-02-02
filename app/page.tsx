"use client"

import { Button } from "@/components/ui/button"
import { mockUsers, mockProjects } from "@/lib/mock-data"
import type { Task, Project } from "@/lib/types"
import { useRouter } from "next/navigation"
import { AssistantChannel } from "@/components/features/assistant/assistant-channel"
import { SearchView } from "@/components/layout/search-view"
import { MembersPanel } from "@/components/features/workspace/members-panel"
import { TaskManagementView } from "@/components/features/tasks/task-management-view"
import { ThreadView } from "@/components/features/chat/thread-view"
import { Sidebar } from "@/components/layout/sidebar"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { InfoPanel } from "@/components/shared/info-panel"
import { TaskDetailSheet } from "@/components/features/tasks/task-detail-sheet"
import { ProjectDetailSheet } from "@/components/features/projects/project-detail-sheet"
import { ProjectSettingsSheet } from "@/components/features/projects/project-settings-sheet"
import { TaskCreateEditDialog } from "@/components/features/tasks/task-create-edit-dialog"
import { useState } from "react"

export default function HomePage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [activeChannel, setActiveChannel] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const [membersMode, setMembersMode] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)
  const [taskCreateEditOpen, setTaskCreateEditOpen] = useState(false)
  const [taskEditMode, setTaskEditMode] = useState<"create" | "edit">("create")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectSheetOpen, setProjectSheetOpen] = useState(false)
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false) // Added project settings open state
  const [tasks, setTasks] = useState<Task[]>([])

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
