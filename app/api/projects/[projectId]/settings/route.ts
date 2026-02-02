import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const projectSettingsSchema = z.object({
  // General settings
  name: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "on-hold", "completed", "archived"]).optional(),
  
  // Access & Permissions
  publicAccess: z.boolean().optional(),
  notifications: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  allowGuestAccess: z.boolean().optional(),
  enableTimeTracking: z.boolean().optional(),
  enableBudgetTracking: z.boolean().optional(),
  
  // Workflow settings
  customStatuses: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
  })).optional(),
  workflowRules: z.array(z.object({
    trigger: z.string(),
    action: z.string(),
    conditions: z.any(),
  })).optional(),
  
  // Automation settings
  autoAssign: z.boolean().optional(),
  autoCloseSprints: z.boolean().optional(),
  sendDailySummaries: z.boolean().optional(),
  enableSlackNotifications: z.boolean().optional(),
  enableEmailDigests: z.boolean().optional(),
  autoArchiveCompletedTasks: z.number().optional(), // days
  escalationRules: z.array(z.object({
    condition: z.string(),
    action: z.string(),
    delay: z.number(),
  })).optional(),
  
  // Theme settings
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  defaultView: z.enum(["overview", "board", "list", "timeline", "calendar"]).optional(),
  taskGrouping: z.enum(["status", "assignee", "priority", "sprint"]).optional(),
  
  // Enterprise features
  budgetLimit: z.number().optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  clientName: z.string().optional(),
  departmentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.array(z.object({
    name: z.string(),
    type: z.enum(["text", "number", "date", "select", "multiselect"]),
    options: z.array(z.string()).optional(),
  })).optional(),
})

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        settings: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Parse settings JSON if exists
    const settings = project.settings ? JSON.parse(project.settings as string) : {}

    return NextResponse.json({
      ...project,
      ...settings,
    })
  } catch (error) {
    console.error(" Error fetching project settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = projectSettingsSchema.parse(body)

    // Separate basic fields from settings
    const { name, icon, description, status, ...settingsData } = validatedData

    // Fetch current settings
    const currentProject = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { settings: true },
    })

    const currentSettings = currentProject?.settings ? JSON.parse(currentProject.settings as string) : {}
    const mergedSettings = { ...currentSettings, ...settingsData }

    // Update project
    const updated = await prisma.project.update({
      where: { id: params.projectId },
      data: {
        ...(name && { name }),
        ...(icon && { icon }),
        ...(description && { description }),
        ...(status && { status }),
        settings: JSON.stringify(mergedSettings),
      },
      include: {
        creator: true,
        members: true,
      },
    })

    return NextResponse.json({
      ...updated,
      ...mergedSettings,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid settings data", details: error.errors }, { status: 400 })
    }
    console.error(" Error updating project settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
