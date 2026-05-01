import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ChannelsService } from "./channels.service";
import { NotificationsService } from "../notifications/notifications.service";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    channel: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    messageRead: {
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    reaction: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    sticker: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock @repo/shared/server using vi.hoisted to avoid ReferenceError
const { mockGetAblyRest } = vi.hoisted(() => ({
  mockGetAblyRest: vi.fn(),
}));

vi.mock("@repo/shared/server", () => ({
  getAblyRest: mockGetAblyRest,
  AblyChannels: {
    channel: vi.fn((id: string) => `channel:${id}`),
    user: vi.fn((id: string) => `user:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: "message.sent",
    MESSAGE_UPDATED: "message.updated",
    MESSAGE_DELETED: "message.deleted",
    MESSAGE_READ: "message.read",
    MESSAGE_REACTION: "message.reaction",
  },
  isUserEligibleForAsset: vi.fn().mockResolvedValue(true),
  logAssetUsage: vi.fn().mockResolvedValue(undefined),
}));

// Mock mention-utils
vi.mock("../common/utils/mention-utils", () => ({
  extractUserMentions: vi.fn().mockReturnValue([]),
  extractChannelMentions: vi.fn().mockReturnValue([]),
  extractUserIds: vi.fn().mockReturnValue([]),
  hasSpecialMention: vi.fn().mockReturnValue(false),
}));

import { prisma } from "@repo/database";

describe("ChannelsService", () => {
  let service: ChannelsService;
  const mockPrisma = prisma as any;

  const mockNotifyMentions = vi.fn().mockResolvedValue(undefined);
  const mockNotifyChannel = vi.fn().mockResolvedValue(undefined);

  const mockNotificationsService = {
    notifyMentions: mockNotifyMentions,
    notifyChannel: mockNotifyChannel,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getGlobalChannels – _count optimization (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("getGlobalChannels - _count optimization", () => {
    it("should query channels with workspaceId: null", async () => {
      mockPrisma.channel.findMany.mockResolvedValue([]);

      await service.getGlobalChannels();

      expect(mockPrisma.channel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: null },
        })
      );
    });

    it("should use _count.members instead of full members list", async () => {
      mockPrisma.channel.findMany.mockResolvedValue([]);

      await service.getGlobalChannels();

      const callArg = mockPrisma.channel.findMany.mock.calls[0][0];
      expect(callArg.include).toHaveProperty("_count");
      expect(callArg.include._count.select).toHaveProperty("members", true);
    });

    it("should NOT include full members array with user data (avoids large payloads)", async () => {
      mockPrisma.channel.findMany.mockResolvedValue([]);

      await service.getGlobalChannels();

      const callArg = mockPrisma.channel.findMany.mock.calls[0][0];
      expect(callArg.include?.members?.include?.user).toBeUndefined();
    });

    it("should include children in the query", async () => {
      mockPrisma.channel.findMany.mockResolvedValue([]);

      await service.getGlobalChannels();

      const callArg = mockPrisma.channel.findMany.mock.calls[0][0];
      expect(callArg.include).toHaveProperty("children", true);
    });

    it("should order channels by createdAt asc", async () => {
      mockPrisma.channel.findMany.mockResolvedValue([]);

      await service.getGlobalChannels();

      const callArg = mockPrisma.channel.findMany.mock.calls[0][0];
      expect(callArg.orderBy).toEqual({ createdAt: "asc" });
    });

    it("should return the channels from Prisma", async () => {
      const mockChannels = [
        { id: "ch-1", name: "general", _count: { members: 10 } },
        { id: "ch-2", name: "random", _count: { members: 5 } },
      ];
      mockPrisma.channel.findMany.mockResolvedValue(mockChannels);

      const result = await service.getGlobalChannels();

      expect(result).toEqual(mockChannels);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // markAsRead – batch createMany optimization (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("markAsRead - batch createMany optimization", () => {
    it("should return success early when messageIds is empty", async () => {
      const result = await service.markAsRead("user-1", []);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.messageRead.createMany).not.toHaveBeenCalled();
    });

    it("should use createMany instead of sequential upserts", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 2 });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-1", ["msg-1", "msg-2"]);

      expect(mockPrisma.messageRead.createMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.messageRead.upsert).not.toHaveBeenCalled();
    });

    it("should call createMany with correct data for all messageIds", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 3 });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-42", ["msg-1", "msg-2", "msg-3"]);

      expect(mockPrisma.messageRead.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ messageId: "msg-1", userId: "user-42" }),
            expect.objectContaining({ messageId: "msg-2", userId: "user-42" }),
            expect.objectContaining({ messageId: "msg-3", userId: "user-42" }),
          ]),
        })
      );
    });

    it("should use skipDuplicates: true to handle already-read messages idempotently", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 0 });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-1", ["msg-1"]);

      const callArg = mockPrisma.messageRead.createMany.mock.calls[0][0];
      expect(callArg.skipDuplicates).toBe(true);
    });

    it("should include readAt timestamp in createMany data", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-1", ["msg-1"]);

      const callArg = mockPrisma.messageRead.createMany.mock.calls[0][0];
      expect(callArg.data[0]).toHaveProperty("readAt");
      expect(callArg.data[0].readAt).toBeInstanceOf(Date);
    });

    it("should return { success: true } on success", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 2 });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.markAsRead("user-1", ["msg-1", "msg-2"]);

      expect(result).toEqual({ success: true });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // markAsRead – Ably notification with channelId (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("markAsRead - Ably notification with channelId", () => {
    it("should publish MESSAGE_READ to user channel when channelId and Ably are available", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 2 });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      const mockChannel = { publish: mockPublish };
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue(mockChannel) },
      });

      await service.markAsRead("user-1", ["msg-1", "msg-2"], "ch-1");

      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({
          channelId: "ch-1",
          messageIds: ["msg-1", "msg-2"],
        })
      );
    });

    it("should publish to the user personal channel (user:userId), not the channel channel", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });

      const mockChannelGet = vi.fn().mockReturnValue({
        publish: vi.fn().mockResolvedValue(undefined),
      });
      mockGetAblyRest.mockReturnValue({
        channels: { get: mockChannelGet },
      });

      await service.markAsRead("user-42", ["msg-1"], "ch-99");

      expect(mockChannelGet).toHaveBeenCalledWith("user:user-42");
    });

    it("should NOT publish when channelId is not provided", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      // No channelId argument
      await service.markAsRead("user-1", ["msg-1"]);

      expect(mockPublish).not.toHaveBeenCalled();
    });

    it("should NOT publish when Ably is unavailable (null)", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.markAsRead("user-1", ["msg-1"], "ch-1");

      expect(result).toEqual({ success: true });
    });

    it("should return { success: true } regardless of Ably availability", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });
      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      const result = await service.markAsRead("user-1", ["msg-1"], "ch-1");

      expect(result).toEqual({ success: true });
    });

    it("should include all messageIds in the Ably notification payload", async () => {
      const messageIds = ["msg-a", "msg-b", "msg-c"];
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 3 });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.markAsRead("user-1", messageIds, "ch-1");

      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({ messageIds })
      );
    });

    it("should not publish when messageIds is empty (returns early before Ably call)", async () => {
      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.markAsRead("user-1", [], "ch-1");

      expect(mockPublish).not.toHaveBeenCalled();
      expect(mockPrisma.messageRead.createMany).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // removeReaction – atomic delete with try/catch (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("removeReaction - atomic delete with idempotency", () => {
    it("should call prisma.reaction.delete with compound unique key", async () => {
      mockPrisma.reaction.delete.mockResolvedValue({ id: "r-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.removeReaction("ch-1", "msg-1", "user-1", "👍");

      expect(mockPrisma.reaction.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            messageId_userId_emoji: {
              messageId: "msg-1",
              userId: "user-1",
              emoji: "👍",
            },
          },
        })
      );
    });

    it("should return { success: true } when reaction is deleted successfully", async () => {
      mockPrisma.reaction.delete.mockResolvedValue({ id: "r-1" });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.removeReaction("ch-1", "msg-1", "user-1", "👍");

      expect(result).toEqual({ success: true });
    });

    it("should return { success: true } when reaction does not exist (P2025 - idempotency)", async () => {
      const prismaNotFoundError = Object.assign(new Error("Not found"), {
        code: "P2025",
      });
      mockPrisma.reaction.delete.mockRejectedValue(prismaNotFoundError);
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.removeReaction("ch-1", "msg-1", "user-1", "👍");

      expect(result).toEqual({ success: true });
    });

    it("should rethrow non-P2025 errors", async () => {
      const dbError = Object.assign(new Error("DB connection failed"), {
        code: "P2024",
      });
      mockPrisma.reaction.delete.mockRejectedValue(dbError);
      mockGetAblyRest.mockReturnValue(null);

      await expect(
        service.removeReaction("ch-1", "msg-1", "user-1", "👍")
      ).rejects.toThrow("DB connection failed");
    });

    it("should NOT publish to Ably when reaction does not exist (P2025)", async () => {
      const prismaNotFoundError = Object.assign(new Error("Not found"), {
        code: "P2025",
      });
      mockPrisma.reaction.delete.mockRejectedValue(prismaNotFoundError);

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.removeReaction("ch-1", "msg-1", "user-1", "👍");

      // Ably should not be called since we hit the error path
      expect(mockPublish).not.toHaveBeenCalled();
    });

    it("should publish MESSAGE_REACTION remove event when reaction is deleted and Ably is available", async () => {
      mockPrisma.reaction.delete.mockResolvedValue({ id: "r-1" });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.removeReaction("ch-1", "msg-1", "user-1", "👍");

      expect(mockPublish).toHaveBeenCalledWith(
        "message.reaction",
        expect.objectContaining({
          messageId: "msg-1",
          emoji: "👍",
          userId: "user-1",
          action: "remove",
        })
      );
    });

    it("should rethrow errors without a code property", async () => {
      const unknownError = new Error("Unexpected failure");
      mockPrisma.reaction.delete.mockRejectedValue(unknownError);
      mockGetAblyRest.mockReturnValue(null);

      await expect(
        service.removeReaction("ch-1", "msg-1", "user-1", "❤️")
      ).rejects.toThrow("Unexpected failure");
    });
  });
});
