import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service";

// Mock @repo/shared/server - all notification functions are delegated here
const {
  mockNotifyMention,
  mockNotifyMentions,
  mockNotifyChannel,
  mockGetAblyRest,
  mockSendPushNotification,
} = vi.hoisted(() => ({
  mockNotifyMention: vi.fn().mockResolvedValue(undefined),
  mockNotifyMentions: vi.fn().mockResolvedValue(undefined),
  mockNotifyChannel: vi.fn().mockResolvedValue(undefined),
  mockGetAblyRest: vi.fn(),
  mockSendPushNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@repo/shared/server", () => ({
  getAblyRest: mockGetAblyRest,
  AblyChannels: {
    notifications: vi.fn((id: string) => `notifications:${id}`),
    user: vi.fn((id: string) => `user:${id}`),
  },
  AblyEvents: {
    NOTIFICATION: "NOTIFICATION",
  },
  sendPushNotification: mockSendPushNotification,
  notifyMention: mockNotifyMention,
  notifyMentions: mockNotifyMentions,
  notifyChannel: mockNotifyChannel,
}));

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    channelMember: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    channel: {
      findUnique: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@repo/database";

describe("NotificationsService", () => {
  let service: NotificationsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createNotification - deliverNotifications (PR change)", () => {
    const basePayload = {
      userId: "user-1",
      type: "mention" as const,
      title: "Test Title",
      message: "Test message",
    };

    it("should create a notification in the database", async () => {
      const createdNotification = {
        id: "notif-1",
        userId: "user-1",
        createdAt: new Date(),
        ...basePayload,
      };
      (prisma.notification.create as any).mockResolvedValue(createdNotification);
      mockGetAblyRest.mockReturnValue(null);

      await service.createNotification(basePayload);

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            type: "mention",
            title: "Test Title",
            message: "Test message",
          }),
        })
      );
    });

    it("should publish to Ably when client is available", async () => {
      const createdNotification = {
        id: "notif-1",
        userId: "user-1",
        createdAt: new Date(),
        ...basePayload,
      };
      (prisma.notification.create as any).mockResolvedValue(createdNotification);

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      const mockAblyChannel = { publish: mockPublish };
      mockGetAblyRest.mockReturnValue({
        channels: {
          get: vi.fn().mockReturnValue(mockAblyChannel),
        },
      });

      await service.createNotification(basePayload);

      expect(mockPublish).toHaveBeenCalledWith(
        "NOTIFICATION",
        expect.objectContaining({
          id: "notif-1",
          userId: "user-1",
        })
      );
    });

    it("should send push notification when creating a notification", async () => {
      const createdNotification = {
        id: "notif-1",
        userId: "user-1",
        createdAt: new Date(),
        ...basePayload,
      };
      (prisma.notification.create as any).mockResolvedValue(createdNotification);
      mockGetAblyRest.mockReturnValue(null);

      await service.createNotification(basePayload);

      expect(mockSendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          title: "Test Title",
          body: "Test message",
          notificationId: "notif-1",
        })
      );
    });
  });

  describe("notifyMention - delegation (PR change)", () => {
    it("should delegate to sharedNotifyMention", async () => {
      await service.notifyMention(
        "msg-1",
        "user-2",
        "Alice",
        "channel-1",
        "Hello @user2"
      );

      expect(mockNotifyMention).toHaveBeenCalledWith(
        "msg-1",
        "user-2",
        "Alice",
        "channel-1",
        "Hello @user2"
      );
    });

    it("should pass all arguments correctly to sharedNotifyMention", async () => {
      await service.notifyMention(
        "message-id",
        "mentioned-user-id",
        "SenderName",
        "ch-id",
        "message content"
      );

      expect(mockNotifyMention).toHaveBeenCalledWith(
        "message-id",
        "mentioned-user-id",
        "SenderName",
        "ch-id",
        "message content"
      );
    });
  });

  describe("notifyMentions - batch delegation (PR change)", () => {
    it("should delegate to sharedNotifyMentions", async () => {
      const userIds = ["user-2", "user-3", "user-4"];
      await service.notifyMentions(
        "msg-1",
        userIds,
        "Alice",
        "channel-1",
        "Hey team!"
      );

      expect(mockNotifyMentions).toHaveBeenCalledWith(
        "msg-1",
        userIds,
        "Alice",
        "channel-1",
        "Hey team!"
      );
    });

    it("should pass array of user IDs to batch function", async () => {
      await service.notifyMentions("msg-1", ["u1", "u2"], "Bob", "ch-1", "content");

      const callArgs = mockNotifyMentions.mock.calls[0];
      expect(Array.isArray(callArgs[1])).toBe(true);
      expect(callArgs[1]).toEqual(["u1", "u2"]);
    });
  });

  describe("notifyChannel - delegation (PR change)", () => {
    it("should delegate to sharedNotifyChannel", async () => {
      await service.notifyChannel(
        "channel-1",
        "Alice",
        "msg-1",
        "Attention @all",
        false
      );

      expect(mockNotifyChannel).toHaveBeenCalledWith(
        "channel-1",
        "Alice",
        "msg-1",
        "Attention @all",
        false
      );
    });

    it("should default isHere to false", async () => {
      await service.notifyChannel("channel-1", "Alice", "msg-1", "content");

      expect(mockNotifyChannel).toHaveBeenCalledWith(
        "channel-1",
        "Alice",
        "msg-1",
        "content",
        false
      );
    });

    it("should pass isHere=true when specified", async () => {
      await service.notifyChannel("channel-1", "Alice", "msg-1", "@here everyone", true);

      expect(mockNotifyChannel).toHaveBeenCalledWith(
        "channel-1",
        "Alice",
        "msg-1",
        "@here everyone",
        true
      );
    });
  });

  describe("markAllRead", () => {
    it("should mark all user notifications as read", async () => {
      (prisma.notification.updateMany as any).mockResolvedValue({ count: 5 });

      const result = await service.markAllRead("user-1");

      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", isRead: false },
          data: { isRead: true },
        })
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // createNotification – edge cases and regression (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("createNotification - edge cases (PR change)", () => {
    const basePayload = {
      userId: "user-1",
      type: "mention" as const,
      title: "Test Title",
      message: "Test message",
    };

    it("should return the created notification", async () => {
      const createdNotification = {
        id: "notif-1",
        userId: "user-1",
        createdAt: new Date(),
        ...basePayload,
      };
      (prisma.notification.create as any).mockResolvedValue(createdNotification);
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.createNotification(basePayload);

      expect(result).toEqual(createdNotification);
    });

    it("should NOT throw if Ably is unavailable (null)", async () => {
      const createdNotification = {
        id: "notif-1",
        userId: "user-1",
        createdAt: new Date(),
        ...basePayload,
      };
      (prisma.notification.create as any).mockResolvedValue(createdNotification);
      mockGetAblyRest.mockReturnValue(null);

      await expect(service.createNotification(basePayload)).resolves.not.toThrow();
    });

    it("should NOT throw if push notification fails (error is caught internally)", async () => {
      const createdNotification = {
        id: "notif-1",
        userId: "user-1",
        createdAt: new Date(),
        ...basePayload,
      };
      (prisma.notification.create as any).mockResolvedValue(createdNotification);
      mockGetAblyRest.mockReturnValue(null);
      mockSendPushNotification.mockRejectedValue(new Error("Push service down"));

      // Should not propagate push failure
      await expect(service.createNotification(basePayload)).resolves.toBeDefined();
    });

    it("should include metadata in the notification when provided", async () => {
      const metadata = { mentionedBy: "Alice", channelName: "general" };
      const payload = { ...basePayload, metadata };
      const createdNotification = { id: "notif-meta", ...payload, createdAt: new Date() };
      (prisma.notification.create as any).mockResolvedValue(createdNotification);
      mockGetAblyRest.mockReturnValue(null);

      await service.createNotification(payload);

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata }),
        })
      );
    });

    it("should include linkUrl in the notification when provided", async () => {
      const payload = { ...basePayload, linkUrl: "/workspace/my-ws/channels/general" };
      const createdNotification = { id: "notif-link", ...payload, createdAt: new Date() };
      (prisma.notification.create as any).mockResolvedValue(createdNotification);
      mockGetAblyRest.mockReturnValue(null);

      await service.createNotification(payload);

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            linkUrl: "/workspace/my-ws/channels/general",
          }),
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // notifyMentions – edge cases (PR change: new method)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("notifyMentions - edge cases (PR change: new method)", () => {
    it("should return the result from sharedNotifyMentions", async () => {
      mockNotifyMentions.mockResolvedValue("some-result" as any);

      const result = await service.notifyMentions(
        "msg-1",
        ["user-2"],
        "Alice",
        "ch-1",
        "content"
      );

      expect(result).toBe("some-result");
    });

    it("should handle empty mentionedUserIds array gracefully", async () => {
      mockNotifyMentions.mockResolvedValue(undefined);

      await expect(
        service.notifyMentions("msg-1", [], "Alice", "ch-1", "content")
      ).resolves.not.toThrow();

      expect(mockNotifyMentions).toHaveBeenCalledWith(
        "msg-1",
        [],
        "Alice",
        "ch-1",
        "content"
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // notifyChannel – edge cases (PR change: delegates to shared)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("notifyChannel - edge cases (PR change: delegates to shared)", () => {
    it("should return the result from sharedNotifyChannel", async () => {
      mockNotifyChannel.mockResolvedValue("channel-result" as any);

      const result = await service.notifyChannel(
        "channel-1",
        "Alice",
        "msg-1",
        "content",
        false
      );

      expect(result).toBe("channel-result");
    });
  });
});