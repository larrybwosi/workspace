import { prisma } from "../db/prisma";

export interface CalComConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface CalComEvent {
  id: number;
  title: string;
  description?: string;
  slug: string;
  length: number;
  hidden: boolean;
  userId: number;
}

export interface CalComBooking {
  id: number;
  uid: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: Array<{
    email: string;
    name: string;
    timeZone: string;
  }>;
  status: "ACCEPTED" | "PENDING" | "CANCELLED";
  eventTypeId: number;
  metadata?: Record<string, any>;
}

export const calComUtils = {
  // Get event types
  listEventTypes: async (config: CalComConfig) => {
    const baseUrl = config.baseUrl || "https://api.cal.com/v1";
    const response = await fetch(`${baseUrl}/event-types`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Get bookings
  listBookings: async (
    config: CalComConfig,
    filters?: {
      status?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) => {
    const baseUrl = config.baseUrl || "https://api.cal.com/v1";
    const params = new URLSearchParams();

    if (filters?.status) params.append("status", filters.status);
    if (filters?.fromDate) params.append("afterStart", filters.fromDate);
    if (filters?.toDate) params.append("beforeEnd", filters.toDate);

    const response = await fetch(`${baseUrl}/bookings?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Create a booking
  createBooking: async (
    config: CalComConfig,
    data: {
      eventTypeId: number;
      start: string;
      responses: {
        name: string;
        email: string;
        location?: string;
        notes?: string;
      };
      metadata?: Record<string, any>;
    },
  ) => {
    const baseUrl = config.baseUrl || "https://api.cal.com/v1";
    const response = await fetch(`${baseUrl}/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Cancel a booking
  cancelBooking: async (
    config: CalComConfig,
    bookingId: number,
    reason?: string,
  ) => {
    const baseUrl = config.baseUrl || "https://api.cal.com/v1";
    const response = await fetch(`${baseUrl}/bookings/${bookingId}/cancel`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Reschedule a booking
  rescheduleBooking: async (
    config: CalComConfig,
    bookingUid: string,
    newStart: string,
    reason?: string,
  ) => {
    const baseUrl = config.baseUrl || "https://api.cal.com/v1";
    const response = await fetch(
      `${baseUrl}/bookings/${bookingUid}/reschedule`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ start: newStart, reason }),
      },
    );

    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Get availability
  getAvailability: async (
    config: CalComConfig,
    params: {
      eventTypeId: number;
      startTime: string;
      endTime: string;
      timeZone?: string;
    },
  ) => {
    const baseUrl = config.baseUrl || "https://api.cal.com/v1";
    const queryParams = new URLSearchParams({
      eventTypeId: params.eventTypeId.toString(),
      startTime: params.startTime,
      endTime: params.endTime,
      ...(params.timeZone && { timeZone: params.timeZone }),
    });

    const response = await fetch(
      `${baseUrl}/availability?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    return response.json();
  },

  // Webhook verification
  verifyWebhook: (
    payload: string,
    signature: string,
    secret: string,
  ): boolean => {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  },
};

// Sync Cal.com bookings to calendar
export async function syncCalComBooking(
  workspaceId: string,
  integrationId: string,
  booking: CalComBooking,
  action: "created" | "rescheduled" | "cancelled",
) {
  try {
    const integration = await prisma.workspaceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.active) {
      return;
    }

    const config = integration.config as any;

    if (action === "created" || action === "rescheduled") {
      // Create or update calendar event
      await prisma.calendarEvent.upsert({
        where: {
          id: `calcom-${booking.uid}`,
        },
        create: {
          id: `calcom-${booking.uid}`,
          userId: config.userId,
          title: booking.title,
          description: booking.description || "",
          startDate: new Date(booking.startTime),
          endDate: new Date(booking.endTime),
          location: booking.attendees[0]?.email || "",
          isAllDay: false,
          metadata: {
            source: "calcom",
            bookingId: booking.id,
            status: booking.status,
            attendees: booking.attendees,
          },
        },
        update: {
          title: booking.title,
          description: booking.description || "",
          startDate: new Date(booking.startTime),
          endDate: new Date(booking.endTime),
          location: booking.attendees[0]?.email || "",
          metadata: {
            source: "calcom",
            bookingId: booking.id,
            status: booking.status,
            attendees: booking.attendees,
          },
        },
      });
    } else if (action === "cancelled") {
      // Delete calendar event
      await prisma.calendarEvent.deleteMany({
        where: {
          id: `calcom-${booking.uid}`,
        },
      });
    }
  } catch (error) {
    console.error("[Cal.com Sync Error]:", error);
    throw error;
  }
}
