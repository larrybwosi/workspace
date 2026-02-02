import { prisma } from "@/lib/db/prisma";
import { IntegrationService } from "@/lib/integrations/integration-service";
import { syncPlaneIssue } from "@/lib/integrations/plane";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const integrationId = request.nextUrl.searchParams.get("integrationId");

    if (!integrationId) {
      return NextResponse.json(
        { error: "Integration ID required" },
        { status: 400 },
      );
    }

    const integration = await prisma.workspaceIntegration.findUnique({
      where: { id: integrationId },
      include: { workspace: true },
    });

    if (!integration || !integration.active) {
      return NextResponse.json(
        { error: "Integration not found or inactive" },
        { status: 404 },
      );
    }

    const { event, data, project_id, state } = body;

    // Handle different Plane events
    let action: "created" | "updated" | "deleted";
    let eventType: string;

    switch (event) {
      case "issue.created":
        action = "created";
        eventType = "issue.created";
        break;
      case "issue.updated":
        action = "updated";
        eventType = "issue.updated";
        break;
      case "issue.deleted":
        action = "deleted";
        eventType = "issue.deleted";
        break;
      default:
        console.log("[Plane] Unknown event:", event);
        return NextResponse.json({ received: true });
    }

    // Get state group for mapping
    const stateGroup = state?.group || "unstarted";

    // Sync issue to task
    await syncPlaneIssue(
      integration.workspaceId,
      integration.id,
      project_id,
      data,
      stateGroup,
      action,
    );

    // Send notification to workspace
    const integrationPayload = {
      event: eventType,
      workspace: {
        id: integration.workspaceId,
        name: integration.workspace.name,
      },
      data: {
        name: data.name,
        project: project_id,
        priority: data.priority,
        state: state?.name,
        assignees: data.assignees?.length || 0,
        labels: data.labels,
      },
      timestamp: new Date().toISOString(),
    };

    // Trigger outgoing webhooks
    const outgoingWebhooks = await prisma.workspaceWebhook.findMany({
      where: {
        workspaceId: integration.workspaceId,
        events: {
          hasSome: [eventType, "*"],
        },
        isActive: true,
      },
    });

    for (const webhook of outgoingWebhooks) {
      try {
        if (webhook.targetType === "slack") {
          const message =
            IntegrationService.formatSlackMessage(integrationPayload);
          await IntegrationService.sendToSlack(webhook.url, message);
        } else if (webhook.targetType === "discord") {
          const message =
            IntegrationService.formatDiscordMessage(integrationPayload);
          await IntegrationService.sendToDiscord(webhook.url, message);
        } else if (webhook.targetType === "teams") {
          const message =
            IntegrationService.formatTeamsMessage(integrationPayload);
          await IntegrationService.sendToTeams(webhook.url, message);
        } else {
          await IntegrationService.sendToCustom(
            webhook.url,
            integrationPayload,
            webhook.secret || "",
            (webhook.headers as Record<string, string>) || {},
          );
        }
      } catch (error) {
        console.error("[Plane Webhook Error]:", error);
      }
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error("[Plane Webhook Error]:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
