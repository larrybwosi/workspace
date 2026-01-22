import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import crypto from "crypto"

const createIntegrationSchema = z.object({
  service: z.enum([
    "slack",
    "github",
    "gitlab",
    "jira",
    "linear",
    "notion",
    "figma",
    "discord",
    "teams",
    "zapier",
    "make",
    "custom",
  ]),
  name: z.string().min(1).max(100),
  config: z.object({
    webhookUrl: z.string().url().optional(),
    apiKey: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    channelId: z.string().optional(),
    repositoryId: z.string().optional(),
    projectId: z.string().optional(),
    teamId: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    customHeaders: z.record(z.string()).optional(),
    events: z.array(z.string()).optional(),
  }),
  description: z.string().optional(),
})

const INTEGRATION_METADATA = {
  slack: {
    name: "Slack",
    icon: "slack",
    color: "#4A154B",
    events: ["message.created", "task.created", "task.completed", "project.created", "member.joined"],
    scopes: ["chat:write", "channels:read", "users:read"],
  },
  github: {
    name: "GitHub",
    icon: "github",
    color: "#24292E",
    events: ["commit.pushed", "pr.created", "pr.merged", "issue.created", "release.published"],
    scopes: ["repo", "read:user", "workflow"],
  },
  gitlab: {
    name: "GitLab",
    icon: "gitlab",
    color: "#FC6D26",
    events: ["commit.pushed", "mr.created", "mr.merged", "issue.created", "pipeline.completed"],
    scopes: ["api", "read_user", "read_repository"],
  },
  jira: {
    name: "Jira",
    icon: "jira",
    color: "#0052CC",
    events: ["issue.created", "issue.updated", "issue.resolved", "sprint.started", "sprint.completed"],
    scopes: ["read:jira-work", "write:jira-work"],
  },
  linear: {
    name: "Linear",
    icon: "linear",
    color: "#5E6AD2",
    events: ["issue.created", "issue.updated", "issue.completed", "cycle.started", "cycle.completed"],
    scopes: ["read", "write", "issues:create"],
  },
  notion: {
    name: "Notion",
    icon: "notion",
    color: "#000000",
    events: ["page.created", "page.updated", "database.updated"],
    scopes: ["read_content", "update_content", "insert_content"],
  },
  figma: {
    name: "Figma",
    icon: "figma",
    color: "#F24E1E",
    events: ["file.updated", "comment.created", "version.published"],
    scopes: ["file_read", "file_comments:write"],
  },
  discord: {
    name: "Discord",
    icon: "discord",
    color: "#5865F2",
    events: ["message.created", "task.created", "task.completed", "alert.triggered"],
    scopes: ["bot", "applications.commands"],
  },
  teams: {
    name: "Microsoft Teams",
    icon: "teams",
    color: "#6264A7",
    events: ["message.created", "task.created", "meeting.scheduled", "alert.triggered"],
    scopes: ["ChannelMessage.Send", "Chat.ReadWrite"],
  },
  zapier: {
    name: "Zapier",
    icon: "zapier",
    color: "#FF4A00",
    events: ["*"],
    scopes: [],
  },
  make: {
    name: "Make (Integromat)",
    icon: "make",
    color: "#6D00CC",
    events: ["*"],
    scopes: [],
  },
  custom: {
    name: "Custom Webhook",
    icon: "webhook",
    color: "#6366F1",
    events: ["*"],
    scopes: [],
  },
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check membership
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const integrations = await prisma.workspaceIntegration.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    })

    // Enrich with metadata and mask sensitive data
    const enrichedIntegrations = integrations.map((integration) => {
      const config = integration.config as Record<string, any>
      const metadata = INTEGRATION_METADATA[integration.service as keyof typeof INTEGRATION_METADATA]

      return {
        ...integration,
        metadata,
        config: {
          ...config,
          apiKey: config.apiKey ? `${config.apiKey.slice(0, 8)}...` : undefined,
          accessToken: config.accessToken ? "••••••••" : undefined,
          refreshToken: undefined,
        },
      }
    })

    return NextResponse.json({
      integrations: enrichedIntegrations,
      availableServices: Object.entries(INTEGRATION_METADATA).map(([key, value]) => ({
        id: key,
        ...value,
      })),
    })
  } catch (error) {
    console.error("Failed to fetch integrations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin/owner role
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createIntegrationSchema.parse(body)

    // Generate integration secret for webhook verification
    const integrationSecret = crypto.randomBytes(32).toString("hex")

    const integration = await prisma.workspaceIntegration.create({
      data: {
        workspaceId,
        service: validatedData.service,
        config: {
          ...validatedData.config,
          secret: integrationSecret,
          name: validatedData.name,
          description: validatedData.description,
        },
        active: true,
      },
    })

    // Create audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "integration.created",
        resource: "integration",
        resourceId: integration.id,
        metadata: {
          service: validatedData.service,
          name: validatedData.name,
        },
      },
    })

    return NextResponse.json(
      {
        ...integration,
        secret: integrationSecret,
        message: "Integration created. Store the secret securely - it won't be shown again.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Failed to create integration:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
