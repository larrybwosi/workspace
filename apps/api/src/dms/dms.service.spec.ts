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
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    dMMessageReaction: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
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

  describe("markAsRead - Ably notification for DMs (PR change)", () => {
    it("should publish MESSAGE_READ to user Ably channel when ably is available", async () => {
      mockPrisma.dMMessageRead.upsert.mockResolvedValue({});
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

    it("should publish to the user personal channel (not the DM channel)", async () => {
      mockPrisma.dMMessageRead.upsert.mockResolvedValue({});
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: "dm-msg-1",
        dmId: "dm-conv-1",
      });

      const mockChannelGet = vi.fn().mockReturnValue({ publish: vi.fn().mockResolvedValue(undefined) });
      mockGetAblyRest.mockReturnValue({
        channels: { get: mockChannelGet },
      });

      await service.markAsRead("user-42", ["dm-msg-1"]);

      // Should publish to user channel, not dm channel
      expect(mockChannelGet).toHaveBeenCalledWith("user:user-42");
    });

    it("should NOT publish when Ably is unavailable (null)", async () => {
      mockPrisma.dMMessageRead.upsert.mockResolvedValue({});
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: "dm-msg-1",
        dmId: "dm-conv-1",
      });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.markAsRead("user-1", ["dm-msg-1"]);

      expect(result).toEqual({ success: true });
    });

    it("should NOT publish when firstMessage is not found", async () => {
      mockPrisma.dMMessageRead.upsert.mockResolvedValue({});
      mockPrisma.dMMessage.findUnique.mockResolvedValue(null);

      const mockPublish = vi.fn();
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      const result = await service.markAsRead("user-1", ["nonexistent-msg"]);

      expect(mockPublish).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("should look up the dmId from the first message", async () => {
      mockPrisma.dMMessageRead.upsert.mockResolvedValue({});
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

    it("should upsert read records for all messageIds", async () => {
      mockPrisma.dMMessageRead.upsert.mockResolvedValue({});
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: "dm-msg-1", dmId: "dm-1" });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead("user-1", ["dm-msg-1", "dm-msg-2", "dm-msg-3"]);

      expect(mockPrisma.dMMessageRead.upsert).toHaveBeenCalledTimes(3);
    });

    it("should include all messageIds in the Ably notification", async () => {
      const messageIds = ["msg-1", "msg-2", "msg-3"];
      mockPrisma.dMMessageRead.upsert.mockResolvedValue({});
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
  });
});