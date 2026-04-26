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

// Mock @repo/shared/server
const mockGetAblyRest = vi.fn();

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
  describe("getGlobalChannels - _count optimization (PR change)", () => {
    it("should query channels with workspaceId: null", async () => {
      mockPrisma.channel.findMany.mockResolvedValue([]);

      await service.getGlobalChannels();

      expect(mockPrisma.channel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: null },
        })
      );
    });

    it("should use _count.members instead of full members list (PR change)", async () => {
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
      // Should NOT have members.include.user (that was the old pattern)
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
  describe("markAsRead - batch createMany optimization (PR change)", () => {
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
  describe("markAsRead - Ably notification with channelId (PR change)", () => {
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
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // removeReaction – atomic delete with try/catch (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("removeReaction - atomic delete with try/catch (PR change)", () => {
    it("should delete reaction using compound unique key", async () => {
      mockPrisma.reaction.delete.mockResolvedValue({ id: "r-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.removeReaction("ch-1", "msg-1", "user-1", "👍");

      expect(mockPrisma.reaction.delete).toHaveBeenCalledWith({
        where: {
          messageId_userId_emoji: {
            messageId: "msg-1",
            userId: "user-1",
            emoji: "👍",
          },
        },
      });
    });

    it("should return { success: true } after deleting reaction", async () => {
      mockPrisma.reaction.delete.mockResolvedValue({ id: "r-1" });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.removeReaction("ch-1", "msg-1", "user-1", "👍");

      expect(result).toEqual({ success: true });
    });

    it("should silently ignore P2025 error (record does not exist – idempotency)", async () => {
      const prismaError = new Error("Record to delete does not exist");
      (prismaError as any).code = "P2025";
      mockPrisma.reaction.delete.mockRejectedValue(prismaError);

      await expect(
        service.removeReaction("ch-1", "msg-1", "user-1", "👍")
      ).resolves.toEqual({ success: true });
    });

    it("should rethrow non-P2025 errors", async () => {
      const dbError = new Error("DB connection error");
      (dbError as any).code = "P1001";
      mockPrisma.reaction.delete.mockRejectedValue(dbError);

      await expect(
        service.removeReaction("ch-1", "msg-1", "user-1", "👍")
      ).rejects.toThrow("DB connection error");
    });

    it("should rethrow error without code property", async () => {
      const genericError = new Error("Unexpected error");
      mockPrisma.reaction.delete.mockRejectedValue(genericError);

      await expect(
        service.removeReaction("ch-1", "msg-1", "user-1", "❤️")
      ).rejects.toThrow("Unexpected error");
    });

    it("should publish MESSAGE_REACTION remove event to Ably channel when available", async () => {
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

    it("should NOT publish when Ably is null", async () => {
      mockPrisma.reaction.delete.mockResolvedValue({ id: "r-1" });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.removeReaction("ch-1", "msg-1", "user-1", "👍");

      expect(result).toEqual({ success: true });
    });

    it("should not publish Ably event when P2025 is silently swallowed", async () => {
      const prismaError = new Error("Record does not exist");
      (prismaError as any).code = "P2025";
      mockPrisma.reaction.delete.mockRejectedValue(prismaError);

      const mockPublish = vi.fn();
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.removeReaction("ch-1", "msg-1", "user-1", "👍");

      expect(mockPublish).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // createMessage – batch notifyMentions (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("createMessage - batch notifyMentions (PR change)", () => {
    beforeEach(() => {
      mockGetAblyRest.mockReturnValue(null);
      mockNotifyMentions.mockReset();
      mockNotifyChannel.mockReset();
      mockNotifyMentions.mockResolvedValue(undefined);
      mockNotifyChannel.mockResolvedValue(undefined);
    });

    it("should call notifyMentions when there are mentioned users other than sender", async () => {
      const { extractUserMentions, extractUserIds } = await import(
        "../common/utils/mention-utils"
      );
      vi.mocked(extractUserMentions).mockReturnValue(["bob"]);
      vi.mocked(extractUserIds).mockReturnValue(["user-2"]);

      const createdMessage = {
        id: "msg-new",
        channelId: "ch-1",
        userId: "user-1",
        content: "Hello @bob",
        user: { id: "user-1", name: "Alice" },
        reactions: [],
        attachments: [],
        mentions: [],
      };
      mockPrisma.$transaction.mockResolvedValue(createdMessage);

      await service.createMessage("ch-1", "user-1", { content: "Hello @bob" });

      expect(mockNotifyMentions).toHaveBeenCalledWith(
        "msg-new",
        ["user-2"],
        "Alice",
        "ch-1",
        "Hello @bob"
      );
    });

    it("should NOT call notifyMentions when sender is the only mentioned user (self-mention filter)", async () => {
      const { extractUserMentions, extractUserIds } = await import(
        "../common/utils/mention-utils"
      );
      vi.mocked(extractUserMentions).mockReturnValue(["alice"]);
      vi.mocked(extractUserIds).mockReturnValue(["user-1"]); // sender's own ID

      const createdMessage = {
        id: "msg-new",
        channelId: "ch-1",
        userId: "user-1",
        content: "Hello @alice",
        user: { id: "user-1", name: "Alice" },
        reactions: [],
        attachments: [],
        mentions: [],
      };
      mockPrisma.$transaction.mockResolvedValue(createdMessage);

      await service.createMessage("ch-1", "user-1", { content: "Hello @alice" });

      expect(mockNotifyMentions).not.toHaveBeenCalled();
    });

    it("should call notifyMentions ONCE with all recipient IDs (single batch call)", async () => {
      const { extractUserMentions, extractUserIds } = await import(
        "../common/utils/mention-utils"
      );
      vi.mocked(extractUserMentions).mockReturnValue(["bob", "charlie"]);
      vi.mocked(extractUserIds).mockReturnValue(["user-2", "user-3"]);

      const createdMessage = {
        id: "msg-new",
        channelId: "ch-1",
        userId: "user-1",
        content: "Hey @bob and @charlie",
        user: { id: "user-1", name: "Alice" },
        reactions: [],
        attachments: [],
        mentions: [],
      };
      mockPrisma.$transaction.mockResolvedValue(createdMessage);

      await service.createMessage("ch-1", "user-1", {
        content: "Hey @bob and @charlie",
      });

      // Called exactly once (batch), not once per user (loop)
      expect(mockNotifyMentions).toHaveBeenCalledTimes(1);
      expect(mockNotifyMentions).toHaveBeenCalledWith(
        "msg-new",
        expect.arrayContaining(["user-2", "user-3"]),
        "Alice",
        "ch-1",
        "Hey @bob and @charlie"
      );
    });

    it("should NOT call notifyMentions when there are no mentions", async () => {
      const { extractUserMentions, extractUserIds } = await import(
        "../common/utils/mention-utils"
      );
      vi.mocked(extractUserMentions).mockReturnValue([]);
      vi.mocked(extractUserIds).mockReturnValue([]);

      const createdMessage = {
        id: "msg-no-mentions",
        channelId: "ch-1",
        userId: "user-1",
        content: "Hello world",
        user: { id: "user-1", name: "Alice" },
        reactions: [],
        attachments: [],
        mentions: [],
      };
      mockPrisma.$transaction.mockResolvedValue(createdMessage);

      await service.createMessage("ch-1", "user-1", { content: "Hello world" });

      expect(mockNotifyMentions).not.toHaveBeenCalled();
    });

    it("should call notifyChannel when @all is mentioned", async () => {
      const { extractUserMentions, extractUserIds, hasSpecialMention } =
        await import("../common/utils/mention-utils");
      vi.mocked(extractUserMentions).mockReturnValue([]);
      vi.mocked(extractUserIds).mockReturnValue([]);
      vi.mocked(hasSpecialMention).mockImplementation(
        (_content: string, type: string) => type === "all"
      );

      const createdMessage = {
        id: "msg-all",
        channelId: "ch-1",
        userId: "user-1",
        content: "@all check this out",
        user: { id: "user-1", name: "Alice" },
        reactions: [],
        attachments: [],
        mentions: [],
      };
      mockPrisma.$transaction.mockResolvedValue(createdMessage);

      await service.createMessage("ch-1", "user-1", {
        content: "@all check this out",
      });

      expect(mockNotifyChannel).toHaveBeenCalledWith(
        "ch-1",
        "Alice",
        "msg-all",
        "@all check this out",
        false // mentionsHere = false
      );
    });

    it("should use fallback sender name 'Someone' when user has no name", async () => {
      const { extractUserMentions, extractUserIds } = await import(
        "../common/utils/mention-utils"
      );
      vi.mocked(extractUserMentions).mockReturnValue(["bob"]);
      vi.mocked(extractUserIds).mockReturnValue(["user-2"]);

      const createdMessage = {
        id: "msg-no-name",
        channelId: "ch-1",
        userId: "user-1",
        content: "Hello @bob",
        user: null, // No user object
        reactions: [],
        attachments: [],
        mentions: [],
      };
      mockPrisma.$transaction.mockResolvedValue(createdMessage);

      await service.createMessage("ch-1", "user-1", { content: "Hello @bob" });

      expect(mockNotifyMentions).toHaveBeenCalledWith(
        "msg-no-name",
        ["user-2"],
        "Someone",
        "ch-1",
        "Hello @bob"
      );
    });
  });
});