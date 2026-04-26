import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { DmsService } from "./dms.service";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    directMessage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    dMMessage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    dMMessageRead: {
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    dMReaction: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock @repo/shared/server
const mockGetAblyRest = vi.fn();

vi.mock("@repo/shared/server", () => ({
  getAblyRest: mockGetAblyRest,
  AblyChannels: {
    user: vi.fn((id: string) => `user:${id}`),
    channel: vi.fn((id: string) => `channel:${id}`),
    dm: vi.fn((id: string) => `dm:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: "message.sent",
    MESSAGE_UPDATED: "message.updated",
    MESSAGE_DELETED: "message.deleted",
    MESSAGE_READ: "message.read",
  },
  publishToAbly: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@repo/database";

describe("DmsService", () => {
  let service: DmsService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [DmsService],
    }).compile();

    service = module.get<DmsService>(DmsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("markAsRead - batch createMany optimization (PR change)", () => {
    it("should return success early when messageIds is empty", async () => {
      const result = await service.markAsRead("user-1", []);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.dMMessageRead.createMany).not.toHaveBeenCalled();
    });

    it("should use createMany instead of sequential upserts", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: "dm-msg-1", dmId: "dm-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-1", ["dm-msg-1", "dm-msg-2", "dm-msg-3"]);

      expect(mockPrisma.dMMessageRead.createMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.dMMessageRead.upsert).not.toHaveBeenCalled();
    });

    it("should call createMany with correct data for all messageIds", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: "msg-1", dmId: "dm-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-42", ["msg-1", "msg-2"]);

      expect(mockPrisma.dMMessageRead.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ messageId: "msg-1", userId: "user-42" }),
            expect.objectContaining({ messageId: "msg-2", userId: "user-42" }),
          ]),
          skipDuplicates: true,
        })
      );
    });

    it("should use skipDuplicates: true to handle already-read messages", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: "msg-1", dmId: "dm-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-1", ["msg-1"]);

      const callArg = mockPrisma.dMMessageRead.createMany.mock.calls[0][0];
      expect(callArg.skipDuplicates).toBe(true);
    });

    it("should include readAt timestamp in createMany data", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: "msg-1", dmId: "dm-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-1", ["msg-1"]);

      const callArg = mockPrisma.dMMessageRead.createMany.mock.calls[0][0];
      expect(callArg.data[0]).toHaveProperty("readAt");
      expect(callArg.data[0].readAt).toBeInstanceOf(Date);
    });
  });

  describe("markAsRead - Ably notification (PR change)", () => {
    it("should publish MESSAGE_READ to user Ably channel when ably is available", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: "dm-msg-1",
        dmId: "dm-conversation-1",
      });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      const mockChannel = { publish: mockPublish };
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue(mockChannel) },
      });

      const result = await service.markAsRead("user-1", ["dm-msg-1", "dm-msg-2"]);

      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({
          dmId: "dm-conversation-1",
          messageIds: ["dm-msg-1", "dm-msg-2"],
        })
      );
      expect(result).toEqual({ success: true });
    });

    it("should publish to the user personal channel (user:userId)", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: "dm-msg-1",
        dmId: "dm-conv-1",
      });

      const mockChannelGet = vi.fn().mockReturnValue({
        publish: vi.fn().mockResolvedValue(undefined),
      });
      mockGetAblyRest.mockReturnValue({
        channels: { get: mockChannelGet },
      });

      await service.markAsRead("user-42", ["dm-msg-1"]);

      // Should publish to user channel, not dm channel
      expect(mockChannelGet).toHaveBeenCalledWith("user:user-42");
    });

    it("should NOT publish when Ably is unavailable (null)", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: "dm-msg-1",
        dmId: "dm-conv-1",
      });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.markAsRead("user-1", ["dm-msg-1"]);

      expect(result).toEqual({ success: true });
    });

    it("should NOT publish when firstMessage is not found", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue(null);

      const mockPublish = vi.fn();
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      const result = await service.markAsRead("user-1", ["nonexistent-msg"]);

      expect(mockPublish).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("should look up dmId from the first message in the array", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: "first-msg",
        dmId: "dm-from-first-message",
      });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.markAsRead("user-1", ["first-msg", "second-msg", "third-msg"]);

      expect(mockPrisma.dMMessage.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "first-msg" },
          select: { dmId: true },
        })
      );

      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({ dmId: "dm-from-first-message" })
      );
    });

    it("should include all messageIds in the Ably notification payload", async () => {
      const messageIds = ["msg-1", "msg-2", "msg-3"];
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: "msg-1", dmId: "dm-conv-1" });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.markAsRead("user-1", messageIds);

      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({ messageIds })
      );
    });

    it("should return success true regardless of Ably availability", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: "msg-1", dmId: "dm-1" });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      const result = await service.markAsRead("user-1", ["msg-1"]);
      expect(result).toEqual({ success: true });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // markAsRead – dmId parameter optimization (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("markAsRead - dmId parameter optimization (PR change)", () => {
    it("should skip DB lookup for first message when dmId is provided directly", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-1", ["msg-1"], "dm-direct-id");

      // When dmId is provided, should not look up first message
      expect(mockPrisma.dMMessage.findUnique).not.toHaveBeenCalled();
    });

    it("should use the provided dmId in Ably notification payload", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.markAsRead("user-1", ["msg-1"], "dm-provided-directly");

      expect(mockPublish).toHaveBeenCalledWith(
        "message.read",
        expect.objectContaining({ dmId: "dm-provided-directly" })
      );
    });

    it("should look up dmId from first message when dmId param is absent", async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: "msg-1", dmId: "dm-from-lookup" });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-1", ["msg-1", "msg-2"]);

      expect(mockPrisma.dMMessage.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "msg-1" },
          select: { dmId: true },
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // removeReaction – atomic delete with try/catch (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("removeReaction - atomic delete with try/catch (PR change)", () => {
    it("should delete the reaction using compound unique key", async () => {
      mockPrisma.dMReaction.delete.mockResolvedValue({ id: "reaction-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.removeReaction("dm-1", "msg-1", "user-1", "👍");

      expect(mockPrisma.dMReaction.delete).toHaveBeenCalledWith({
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
      mockPrisma.dMReaction.delete.mockResolvedValue({ id: "reaction-1" });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.removeReaction("dm-1", "msg-1", "user-1", "👍");

      expect(result).toEqual({ success: true });
    });

    it("should silently ignore P2025 error (record does not exist)", async () => {
      const prismaError = new Error("Record to delete does not exist");
      (prismaError as any).code = "P2025";
      mockPrisma.dMReaction.delete.mockRejectedValue(prismaError);

      await expect(
        service.removeReaction("dm-1", "msg-1", "user-1", "👍")
      ).resolves.toEqual({ success: true });
    });

    it("should rethrow non-P2025 errors", async () => {
      const otherError = new Error("DB connection error");
      (otherError as any).code = "P1001";
      mockPrisma.dMReaction.delete.mockRejectedValue(otherError);

      await expect(
        service.removeReaction("dm-1", "msg-1", "user-1", "👍")
      ).rejects.toThrow("DB connection error");
    });

    it("should publish MESSAGE_REACTION remove event to Ably when Ably is available", async () => {
      mockPrisma.dMReaction.delete.mockResolvedValue({ id: "reaction-1" });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.removeReaction("dm-1", "msg-1", "user-1", "👍");

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
      mockPrisma.dMReaction.delete.mockResolvedValue({ id: "reaction-1" });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.removeReaction("dm-1", "msg-1", "user-1", "👍");

      expect(result).toEqual({ success: true });
    });

    it("should NOT call findUnique before delete (atomic optimization)", async () => {
      mockPrisma.dMReaction.delete.mockResolvedValue({ id: "reaction-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.removeReaction("dm-1", "msg-1", "user-1", "👍");

      // Should never call findUnique – the optimization removes the pre-flight check
      expect(mockPrisma.dMReaction.findUnique).not.toHaveBeenCalled();
    });

    it("should not publish Ably event when P2025 is silently swallowed", async () => {
      const prismaError = new Error("Record does not exist");
      (prismaError as any).code = "P2025";
      mockPrisma.dMReaction.delete.mockRejectedValue(prismaError);

      const mockPublish = vi.fn();
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.removeReaction("dm-1", "msg-1", "user-1", "👍");

      expect(mockPublish).not.toHaveBeenCalled();
    });

    it("should rethrow error without code property as non-P2025", async () => {
      const genericError = new Error("Unexpected error");
      mockPrisma.dMReaction.delete.mockRejectedValue(genericError);

      await expect(
        service.removeReaction("dm-1", "msg-1", "user-1", "❤️")
      ).rejects.toThrow("Unexpected error");
    });
  });
});