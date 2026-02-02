import { prisma } from "@/lib/db/prisma";
import { IntegrationService } from "@/lib/integrations/integration-service";
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

    const { event, page } = body;

    // Handle different Affine events
    let action: "created" | "updated" | "deleted";
    let eventType: string;

    switch (event) {
      case "page.created":
        action = "created";
        eventType = "page.created";
        break;
      case "page.updated":
        action = "updated";
        eventType = "page.updated";
        break;
      case "page.deleted":
        action = "deleted";
        eventType = "page.deleted";
        break;
      default:
        console.log("[Affine] Unknown event:", event);
        return NextResponse.json({ received: true });
    }

    // Sync page to notes
    await syncAffinePage(integration.workspaceId, integration.id, page, action);

    // Send notification to workspace
    const integrationPayload = {
      event: eventType,
      workspace: {
        id: integration.workspaceId,
        name: integration.workspace.name,
      },
      data: {
        title: page.title,
        workspaceId: page.workspaceId,
        isPublic: page.isPublic,
        tags: page.tags,
        updatedAt: page.updatedAt,
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
        // isActive: true,
      },
    });

    for (const webhook of outgoingWebhooks) {
      try {
        if (webhook.name === "slack") {
          const message =
            IntegrationService.formatSlackMessage(integrationPayload);
          await IntegrationService.sendToSlack(webhook.url, message);
        } else if (webhook.name === "discord") {
          const message =
            IntegrationService.formatDiscordMessage(integrationPayload);
          await IntegrationService.sendToDiscord(webhook.url, message);
        } else if (webhook.name === "teams") {
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
        console.error("[Affine Webhook Error]:", error);
      }
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error("[Affine Webhook Error]:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
