import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { MessagesService } from "./messages.service";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    channel: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    channelMember: {
      findUnique: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    messageRead: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    messageMention: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    messageReaction: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    customEmoji: {
      findUnique: vi.fn(),
    },
    assetUsage: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock shared server utilities
const mockNotifyMentions = vi.fn().mockResolvedValue(undefined);
const mockNotifyChannel = vi.fn().mockResolvedValue(undefined);
const mockNotifyMention = vi.fn().mockResolvedValue(undefined);
const mockGetAblyRest = vi.fn();

vi.mock("@repo/shared/server", () => ({
  getAblyRest: mockGetAblyRest,
  AblyChannels: {
    channel: vi.fn((id: string) => `channel:${id}`),
    user: vi.fn((id: string) => `user:${id}`),
    notifications: vi.fn((id: string) => `notifications:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: "message.sent",
    MESSAGE_UPDATED: "message.updated",
    MESSAGE_DELETED: "message.deleted",
    MESSAGE_READ: "message.read",
  },
  notifyMention: mockNotifyMention,
  notifyMentions: mockNotifyMentions,
  notifyChannel: mockNotifyChannel,
  isUserEligibleForAsset: vi.fn().mockResolvedValue(true),
  logAssetUsage: vi.fn().mockResolvedValue(undefined),
}));

// Mock mention-utils
vi.mock("@/common/utils/mention-utils", () => ({
  extractUserMentions: vi.fn().mockReturnValue([]),
  extractChannelMentions: vi.fn().mockReturnValue([]),
  extractUserIds: vi.fn().mockReturnValue([]),
  hasSpecialMention: vi.fn().mockReturnValue(false),
}));

// Mock axios to prevent network calls
vi.mock("axios", () => ({ default: { post: vi.fn(), get: vi.fn() } }));

import { prisma } from "@repo/database";

describe("MessagesService", () => {
  let service: MessagesService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesService],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("batchMarkAsRead - Ably notification (PR change)", () => {
    it("should publish MESSAGE_READ event to the user Ably channel when ably is available", async () => {
      mockPrisma.messageRead.upsert.mockResolvedValue({});
      mockPrisma.message.findUnique.mockResolvedValue({
        id: "msg-1",
        channelId: "ch-1",
      });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      const mockChannel = { publish: mockPublish };
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue(mockChannel) },
      });

      const result = await service.batchMarkAsRead("user-1", ["msg-1", "msg-2"]);

      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({
          channelId: "ch-1",
          messageIds: ["msg-1", "msg-2"],
        })
      );
      expect(result).toEqual({ success: true });
    });

    it("should publish to the user's personal channel (not the channel's channel)", async () => {
      mockPrisma.messageRead.upsert.mockResolvedValue({});
      mockPrisma.message.findUnique.mockResolvedValue({
        id: "msg-1",
        channelId: "ch-123",
      });

      const mockChannelGet = vi.fn().mockReturnValue({ publish: vi.fn().mockResolvedValue(undefined) });
      mockGetAblyRest.mockReturnValue({
        channels: { get: mockChannelGet },
      });

      await service.batchMarkAsRead("user-42", ["msg-1"]);

      // Should use AblyChannels.user, not AblyChannels.channel
      expect(mockChannelGet).toHaveBeenCalledWith("user:user-42");
    });

    it("should NOT publish when Ably is unavailable (null)", async () => {
      mockPrisma.messageRead.upsert.mockResolvedValue({});
      mockPrisma.message.findUnique.mockResolvedValue({
        id: "msg-1",
        channelId: "ch-1",
      });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.batchMarkAsRead("user-1", ["msg-1"]);

      // Should still succeed, just no Ably notification
      expect(result).toEqual({ success: true });
    });

    it("should NOT publish when firstMessage is not found", async () => {
      mockPrisma.messageRead.upsert.mockResolvedValue({});
      mockPrisma.message.findUnique.mockResolvedValue(null);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: vi.fn() }) },
      });

      const result = await service.batchMarkAsRead("user-1", ["msg-nonexistent"]);

      // Should succeed, but no Ably publish since firstMessage is null
      expect(result).toEqual({ success: true });
    });

    it("should look up the channelId from the first message in the list", async () => {
      mockPrisma.messageRead.upsert.mockResolvedValue({});
      mockPrisma.message.findUnique.mockResolvedValue({
        id: "msg-first",
        channelId: "channel-from-first-message",
      });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.batchMarkAsRead("user-1", ["msg-first", "msg-second", "msg-third"]);

      // Should look up the first message
      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "msg-first" },
          select: { channelId: true },
        })
      );

      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({ channelId: "channel-from-first-message" })
      );
    });

    it("should upsert read records for all messageIds", async () => {
      mockPrisma.messageRead.upsert.mockResolvedValue({});
      mockPrisma.message.findUnique.mockResolvedValue({ id: "msg-1", channelId: "ch-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.batchMarkAsRead("user-1", ["msg-1", "msg-2", "msg-3"]);

      expect(mockPrisma.messageRead.upsert).toHaveBeenCalledTimes(3);
    });
  });

  describe("sendMessage - batch mention notification (PR change)", () => {
    const mockUser = { id: "user-1", name: "Alice" } as any;

    beforeEach(() => {
      // Setup mock workspace/channel/member for verifyWorkspaceAccess
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1", slug: "my-ws" });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ id: "member-1", userId: "user-1" });
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: "ch-1",
        workspaceId: "ws-1",
        isPrivate: false,
        members: [],
        messageCount: 0,
      });
      mockPrisma.channelMember.findUnique.mockResolvedValue({ id: "cm-1" });
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.messageMention.createMany.mockResolvedValue({ count: 0 });
    });

    it("should call notifyMentions when there are mentioned users that are not the sender (PR change)", async () => {
      const { extractUserMentions, extractUserIds } = await import("@/common/utils/mention-utils");
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
      mockGetAblyRest.mockReturnValue(null);

      await service.sendMessage("user-1", "my-ws", "ch-1", "Hello @bob");

      expect(mockNotifyMentions).toHaveBeenCalledWith(
        "msg-new",
        ["user-2"],
        "Alice",
        "ch-1",
        "Hello @bob"
      );
    });

    it("should NOT call notifyMentions when sender is the only mentioned user", async () => {
      const { extractUserMentions, extractUserIds } = await import("@/common/utils/mention-utils");
      vi.mocked(extractUserMentions).mockReturnValue(["alice"]);
      // Returns the sender's own ID
      vi.mocked(extractUserIds).mockReturnValue(["user-1"]);

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
      mockGetAblyRest.mockReturnValue(null);

      await service.sendMessage("user-1", "my-ws", "ch-1", "Hello @alice");

      // Sender self-mentioned - should filter out and not call notifyMentions
      expect(mockNotifyMentions).not.toHaveBeenCalled();
    });
  });
});