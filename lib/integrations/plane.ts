import { prisma } from "../db/prisma";

export interface PlaneConfig {
  apiToken: string;
  workspaceSlug: string;
  baseUrl?: string;
}

export interface PlaneWorkspace {
  id: string;
  name: string;
  slug: string;
  owner: string;
  created_at: string;
}

export interface PlaneProject {
  id: string;
  name: string;
  description?: string;
  workspace: string;
  identifier: string;
  created_at: string;
  updated_at: string;
}

export interface PlaneIssue {
  id: string;
  name: string;
  description?: string;
  state: string;
  priority: "urgent" | "high" | "medium" | "low" | "none";
  project: string;
  assignees: string[];
  labels: string[];
  created_at: string;
  updated_at: string;
  start_date?: string;
  target_date?: string;
  estimate_point?: number;
}

export interface PlaneState {
  id: string;
  name: string;
  color: string;
  group: "backlog" | "unstarted" | "started" | "completed" | "cancelled";
}

export const planeUtils = {
  // Get workspace
  getWorkspace: async (config: PlaneConfig) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/`,
      {
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.json();
  },

  // List projects
  listProjects: async (config: PlaneConfig) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/projects/`,
      {
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Get project
  getProject: async (config: PlaneConfig, projectId: string) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/projects/${projectId}/`,
      {
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.json();
  },

  // List issues
  listIssues: async (
    config: PlaneConfig,
    projectId: string,
    filters?: {
      state?: string;
      priority?: string;
      assignee?: string;
      labels?: string[];
    },
  ) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const params = new URLSearchParams();

    if (filters?.state) params.append("state", filters.state);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.assignee) params.append("assignees", filters.assignee);
    if (filters?.labels) params.append("labels", filters.labels.join(","));

    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/projects/${projectId}/issues/?${params.toString()}`,
      {
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Get issue
  getIssue: async (config: PlaneConfig, projectId: string, issueId: string) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/projects/${projectId}/issues/${issueId}/`,
      {
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Create issue
  createIssue: async (
    config: PlaneConfig,
    projectId: string,
    data: {
      name: string;
      description?: string;
      state?: string;
      priority?: "urgent" | "high" | "medium" | "low" | "none";
      assignees?: string[];
      labels?: string[];
      start_date?: string;
      target_date?: string;
    },
  ) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/projects/${projectId}/issues/`,
      {
        method: "POST",
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Update issue
  updateIssue: async (
    config: PlaneConfig,
    projectId: string,
    issueId: string,
    data: Partial<{
      name: string;
      description: string;
      state: string;
      priority: string;
      assignees: string[];
      labels: string[];
      start_date: string;
      target_date: string;
    }>,
  ) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/projects/${projectId}/issues/${issueId}/`,
      {
        method: "PATCH",
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete issue
  deleteIssue: async (
    config: PlaneConfig,
    projectId: string,
    issueId: string,
  ) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/projects/${projectId}/issues/${issueId}/`,
      {
        method: "DELETE",
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.ok;
  },

  // Get issue states
  getStates: async (config: PlaneConfig, projectId: string) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/projects/${projectId}/states/`,
      {
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Add comment to issue
  addComment: async (
    config: PlaneConfig,
    projectId: string,
    issueId: string,
    comment: string,
  ) => {
    const baseUrl = config.baseUrl || "https://api.plane.so";
    const response = await fetch(
      `${baseUrl}/api/v1/workspaces/${config.workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`,
      {
        method: "POST",
        headers: {
          "X-Api-Key": config.apiToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      },
    );

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`);
    }

    return response.json();
  },
};

// Map Plane priority to internal priority
function mapPlanePriority(planePriority: string): string {
  const priorityMap: Record<string, string> = {
    urgent: "critical",
    high: "high",
    medium: "medium",
    low: "low",
    none: "none",
  };
  return priorityMap[planePriority] || "medium";
}

// Map Plane state to internal status
function mapPlaneState(stateGroup: string): string {
  const stateMap: Record<string, string> = {
    backlog: "backlog",
    unstarted: "todo",
    started: "in_progress",
    completed: "completed",
    cancelled: "cancelled",
  };
  return stateMap[stateGroup] || "todo";
}

// Sync Plane issue to task
export async function syncPlaneIssue(
  workspaceId: string,
  integrationId: string,
  projectId: string,
  issue: PlaneIssue,
  stateGroup: string,
  action: "created" | "updated" | "deleted",
) {
  try {
    const integration = await prisma.workspaceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.active) {
      return;
    }

    const config = integration.config as any;

    // Find or create corresponding project
    let internalProject = await prisma.project.findFirst({
      where: {
        workspaceId,
        metadata: {
          path: ["planeProjectId"],
          equals: projectId,
        },
      },
    });

    if (!internalProject) {
      // Create project if it doesn't exist
      internalProject = await prisma.project.create({
        data: {
          name: `Plane Project ${projectId}`,
          workspaceId,
          ownerId: config.userId,
          metadata: {
            source: "plane",
            planeProjectId: projectId,
          },
        },
      });
    }

    if (action === "created" || action === "updated") {
      // Create or update task
      await prisma.task.upsert({
        where: {
          id: `plane-${issue.id}`,
        },
        create: {
          id: `plane-${issue.id}`,
          projectId: internalProject.id,
          title: issue.name,
          description: issue.description || "",
          status: mapPlaneState(stateGroup),
          priority: mapPlanePriority(issue.priority),
          dueDate: issue.target_date ? new Date(issue.target_date) : null,
          createdById: config.userId,
          metadata: {
            source: "plane",
            planeIssueId: issue.id,
            planeProjectId: projectId,
            planeState: issue.state,
            planeLabels: issue.labels,
            estimatePoint: issue.estimate_point,
            externalUrl: `${config.baseUrl || "https://app.plane.so"}/${config.workspaceSlug}/projects/${projectId}/issues/${issue.id}`,
          },
        },
        update: {
          title: issue.name,
          description: issue.description || "",
          status: mapPlaneState(stateGroup),
          priority: mapPlanePriority(issue.priority),
          dueDate: issue.target_date ? new Date(issue.target_date) : null,
          metadata: {
            source: "plane",
            planeIssueId: issue.id,
            planeProjectId: projectId,
            planeState: issue.state,
            planeLabels: issue.labels,
            estimatePoint: issue.estimate_point,
            externalUrl: `${config.baseUrl || "https://app.plane.so"}/${config.workspaceSlug}/projects/${projectId}/issues/${issue.id}`,
          },
        },
      });

      // Sync assignees
      if (issue.assignees && issue.assignees.length > 0) {
        // TODO: Map Plane user IDs to internal user IDs
        console.log(
          "[Plane] Assignee sync not yet implemented:",
          issue.assignees,
        );
      }
    } else if (action === "deleted") {
      // Delete task
      await prisma.task.deleteMany({
        where: {
          id: `plane-${issue.id}`,
        },
      });
    }
  } catch (error) {
    console.error("[Plane Sync Error]:", error);
    throw error;
  }
}
