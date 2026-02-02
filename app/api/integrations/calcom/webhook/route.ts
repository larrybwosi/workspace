import { prisma } from "@/lib/db/prisma";
import { calComUtils, syncCalComBooking } from "@/lib/integrations/calcom";
import { IntegrationService } from "@/lib/integrations/integration-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-cal-signature-256");
    const body = await request.text();

    // Get integration config to verify webhook
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

    const config = integration.config as any;

    // Verify webhook signature if secret is configured
    if (signature && config.webhookSecret) {
      const isValid = calComUtils.verifyWebhook(
        body,
        signature,
        config.webhookSecret,
      );
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 },
        );
      }
    }

    const payload = JSON.parse(body);
    const { triggerEvent, payload: eventData } = payload;

    // Handle different Cal.com events
    let action: "created" | "rescheduled" | "cancelled";
    let eventType: string;

    switch (triggerEvent) {
      case "BOOKING_CREATED":
        action = "created";
        eventType = "booking.created";
        break;
      case "BOOKING_RESCHEDULED":
        action = "rescheduled";
        eventType = "booking.rescheduled";
        break;
      case "BOOKING_CANCELLED":
        action = "cancelled";
        eventType = "booking.cancelled";
        break;
      default:
        console.log("[Cal.com] Unknown event:", triggerEvent);
        return NextResponse.json({ received: true });
    }

    // Sync booking to calendar
    await syncCalComBooking(
      integration.workspaceId,
      integration.id,
      eventData,
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
        title: eventData.title,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        attendees: eventData.attendees?.map((a: any) => a.email).join(", "),
        status: eventData.status,
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
        console.error("[Cal.com Webhook Error]:", error);
      }
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error("[Cal.com Webhook Error]:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
