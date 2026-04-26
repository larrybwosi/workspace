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
      createMany: vi.fn(),
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

  // ─────────────────────────────────────────────────────────────────────────────
  // verifyWorkspaceAccess – single query optimization (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("verifyWorkspaceAccess - single query optimization (PR change)", () => {
    it("should query workspace with member filter in a single database call", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: "ws-1",
        slug: "my-ws",
        members: [{ userId: "user-1" }],
      });

      await service.verifyWorkspaceAccess("user-1", "my-ws");

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: "my-ws" },
          include: expect.objectContaining({
            members: expect.objectContaining({
              where: { userId: "user-1" },
            }),
          }),
        })
      );
    });

    it("should NOT call workspaceMember.findUnique separately (optimization: single query)", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: "ws-1",
        slug: "my-ws",
        members: [{ userId: "user-1" }],
      });

      await service.verifyWorkspaceAccess("user-1", "my-ws");

      // The optimization removes the separate workspaceMember lookup
      expect(mockPrisma.workspaceMember.findUnique).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when workspace is not found", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      const { NotFoundException } = await import("@nestjs/common");
      await expect(
        service.verifyWorkspaceAccess("user-1", "nonexistent-ws")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException with message 'Workspace not found'", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyWorkspaceAccess("user-1", "nonexistent-ws")
      ).rejects.toThrow("Workspace not found");
    });

    it("should throw ForbiddenException when user is not a workspace member", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: "ws-1",
        slug: "my-ws",
        members: [], // empty: user is not a member
      });

      const { ForbiddenException } = await import("@nestjs/common");
      await expect(
        service.verifyWorkspaceAccess("user-not-member", "my-ws")
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException with message 'Forbidden'", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: "ws-1",
        slug: "my-ws",
        members: [],
      });

      await expect(
        service.verifyWorkspaceAccess("user-not-member", "my-ws")
      ).rejects.toThrow("Forbidden");
    });

    it("should return the workspace when user is a member", async () => {
      const mockWorkspace = {
        id: "ws-1",
        slug: "my-ws",
        members: [{ userId: "user-1" }],
      };
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.verifyWorkspaceAccess("user-1", "my-ws");

      expect(result).toEqual(mockWorkspace);
    });

    it("should include member filter with correct userId in the query", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: "ws-2",
        slug: "other-ws",
        members: [{ userId: "user-42" }],
      });

      await service.verifyWorkspaceAccess("user-42", "other-ws");

      const callArg = mockPrisma.workspace.findUnique.mock.calls[0][0];
      expect(callArg.include.members.where).toEqual({ userId: "user-42" });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // batchMarkAsRead – createMany optimization (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("batchMarkAsRead - createMany optimization (PR change)", () => {
    it("should return success early when messageIds is empty", async () => {
      const result = await service.batchMarkAsRead("user-1", []);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.messageRead.createMany).not.toHaveBeenCalled();
    });

    it("should use createMany instead of sequential upserts", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 2 });
      mockGetAblyRest.mockReturnValue(null);

      await service.batchMarkAsRead("user-1", ["msg-1", "msg-2"], "ch-1");

      expect(mockPrisma.messageRead.createMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.messageRead.upsert).not.toHaveBeenCalled();
    });

    it("should use skipDuplicates: true for idempotency", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 0 });
      mockGetAblyRest.mockReturnValue(null);

      await service.batchMarkAsRead("user-1", ["msg-1"], "ch-1");

      const callArg = mockPrisma.messageRead.createMany.mock.calls[0][0];
      expect(callArg.skipDuplicates).toBe(true);
    });

    it("should call createMany with correct data for all messageIds", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 2 });
      mockGetAblyRest.mockReturnValue(null);

      await service.batchMarkAsRead("user-55", ["msg-a", "msg-b"], "ch-1");

      expect(mockPrisma.messageRead.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ messageId: "msg-a", userId: "user-55" }),
            expect.objectContaining({ messageId: "msg-b", userId: "user-55" }),
          ]),
        })
      );
    });

    it("should use provided channelId directly without DB lookup when channelId is given", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.batchMarkAsRead("user-1", ["msg-1"], "ch-provided");

      // Should publish with provided channelId, no message lookup needed
      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({ channelId: "ch-provided" })
      );
      // Should NOT need to look up the message for its channelId
      expect(mockPrisma.message.findUnique).not.toHaveBeenCalled();
    });

    it("should look up channelId from first message when channelId param is absent", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.message.findUnique.mockResolvedValue({
        id: "msg-1",
        channelId: "ch-from-lookup",
      });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.batchMarkAsRead("user-1", ["msg-1", "msg-2"]);

      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "msg-1" },
          select: { channelId: true },
        })
      );
    });

    it("should publish MESSAGE_READ to user personal channel when channelId and Ably are available", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 2 });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      const mockChannelGet = vi.fn().mockReturnValue({ publish: mockPublish });
      mockGetAblyRest.mockReturnValue({
        channels: { get: mockChannelGet },
      });

      await service.batchMarkAsRead("user-7", ["msg-1", "msg-2"], "ch-1");

      // Should publish to user channel (user:userId)
      expect(mockChannelGet).toHaveBeenCalledWith("user:user-7");
      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({
          channelId: "ch-1",
          messageIds: ["msg-1", "msg-2"],
        })
      );
    });

    it("should NOT publish when Ably is null", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.batchMarkAsRead("user-1", ["msg-1"], "ch-1");

      expect(result).toEqual({ success: true });
    });

    it("should return { success: true } regardless of Ably availability", async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      const result = await service.batchMarkAsRead("user-1", ["msg-1"], "ch-1");

      expect(result).toEqual({ success: true });
    });
  });
});
