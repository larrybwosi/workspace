"use client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar";
import { DynamicHeader } from "@/components/dynamic-header";
import { TaskManagementView } from "@/components/task-management-view";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { useParams, useRouter } from "next/navigation";
import type { Task } from "@/lib/types";
import { mockProjects } from "@/lib/mock-data";
import { useProject } from "@/hooks/api/use-projects";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { data: project, isLoading } = useProject(projectId);

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [taskSheetOpen, setTaskSheetOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("tasks");
  const [invitationDialogOpen, setInvitationDialogOpen] = React.useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskSheetOpen(true);
  };

  const handleProjectClick = (clickedProjectId: string) => {
    const clickedProject = mockProjects.find((p) => p.id === clickedProjectId);
    if (clickedProject) {
      // setSelectedProject(clickedProject)
      // setProjectSheetOpen(true)
    }
  };

  const handleChannelSelect = (channelId: string) => {
    if (channelId === "assistant") {
      router.push("/assistant");
    } else if (channelId.startsWith("project-")) {
      router.push(`/projects/${channelId}`);
    } else if (channelId.startsWith("dm-") || channelId.startsWith("task-")) {
      router.push(`/channels/${channelId}`);
    } else {
      router.push(`/channels/${channelId}`);
    }
  };

  const handleBackClick = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "closed":
        return "text-green-600 bg-green-50 dark:bg-green-950";
      case "in-progress":
      case "active":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900";
      case "upcoming":
      case "open":
        return "text-gray-600 bg-gray-50 dark:bg-gray-900";
      case "overdue":
        return "text-red-600 bg-red-50 dark:bg-red-950";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900";
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel={projectId}
        onChannelSelect={handleChannelSelect}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <DynamicHeader
          activeView={projectId}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
          onBackClick={handleBackClick}
        />

        <TaskManagementView
          onTaskClick={handleTaskClick}
          projectId={projectId}
        />
      </main>

      <TaskDetailSheet
        task={selectedTask}
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
      />
    </div>
  );
}
