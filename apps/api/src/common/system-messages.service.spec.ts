import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SystemMessagesService } from "./system-messages.service";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    message: {
      create: vi.fn(),
    },
  },
}));

// Capture mock references for assertions
const mockPublish = vi.fn().mockResolvedValue(undefined);
const mockChannelGet = vi.fn().mockReturnValue({ publish: mockPublish });
const mockGetAblyRest = vi.fn();

vi.mock("@repo/shared/server", () => ({
  getAblyRest: mockGetAblyRest,
  AblyChannels: {
    channel: vi.fn((id: string) => `channel:${id}`),
    thread: vi.fn((id: string) => `thread:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: "message.sent",
  },
}));

import { prisma } from "@repo/database";

describe("SystemMessagesService", () => {
  let service: SystemMessagesService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemMessagesService],
    }).compile();

    service = module.get<SystemMessagesService>(SystemMessagesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createSystemMessage", () => {
    it("should create a system message in the database with correct fields", async () => {
      const createdMessage = {
        id: "msg-1",
        channelId: "ch-1",
        userId: "system",
        content: "System notification",
        messageType: "system",
        metadata: {},
        user: null,
      };
      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.createSystemMessage("System notification", {
        channelId: "ch-1",
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channelId: "ch-1",
            userId: "system",
            content: "System notification",
            messageType: "system",
          }),
        })
      );
      expect(result).toEqual(createdMessage);
    });

    // ── PR FIX: AblyChannels.channel() NOT .thread() ──────────────────────────
    it("should broadcast using AblyChannels.channel (not AblyChannels.thread)", async () => {
      const createdMessage = {
        id: "msg-1",
        channelId: "ch-1",
        userId: "system",
        content: "broadcast test",
        messageType: "system",
        user: null,
      };
      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockGetAblyRest.mockReturnValue({
        channels: { get: mockChannelGet },
      });

      const shared = await import("@repo/shared/server");
      const channelSpy = vi.spyOn(shared.AblyChannels, "channel");
      const threadSpy = vi.spyOn(shared.AblyChannels, "thread");

      await service.createSystemMessage("broadcast test", {
        channelId: "ch-1",
        broadcast: true,
      });

      // Must call .channel(), not .thread()
      expect(channelSpy).toHaveBeenCalledWith("ch-1");
      expect(threadSpy).not.toHaveBeenCalled();
    });

    it("should use the channel string 'channel:ch-1' for Ably channel lookup", async () => {
      const createdMessage = {
        id: "msg-1",
        channelId: "ch-1",
        userId: "system",
        content: "test",
        messageType: "system",
        user: null,
      };
      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockGetAblyRest.mockReturnValue({ channels: { get: mockChannelGet } });

      await service.createSystemMessage("test", { channelId: "ch-1" });

      expect(mockChannelGet).toHaveBeenCalledWith("channel:ch-1");
    });

    it("should publish MESSAGE_SENT event when broadcast is not explicitly false", async () => {
      const createdMessage = {
        id: "msg-1",
        channelId: "ch-1",
        userId: "system",
        content: "test",
        messageType: "system",
        user: null,
      };
      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockGetAblyRest.mockReturnValue({ channels: { get: mockChannelGet } });

      await service.createSystemMessage("test", { channelId: "ch-1" });

      expect(mockPublish).toHaveBeenCalledWith("message.sent", createdMessage);
    });

    it("should NOT broadcast when broadcast is explicitly false", async () => {
      const createdMessage = {
        id: "msg-1",
        channelId: "ch-1",
        userId: "system",
        content: "no broadcast",
        messageType: "system",
        user: null,
      };
      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockGetAblyRest.mockReturnValue({ channels: { get: mockChannelGet } });

      await service.createSystemMessage("no broadcast", {
        channelId: "ch-1",
        broadcast: false,
      });

      expect(mockPublish).not.toHaveBeenCalled();
    });

    it("should NOT call Ably when Ably client is null", async () => {
      const createdMessage = {
        id: "msg-1",
        channelId: "ch-1",
        userId: "system",
        content: "no ably",
        messageType: "system",
        user: null,
      };
      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockGetAblyRest.mockReturnValue(null);

      await service.createSystemMessage("no ably", {
        channelId: "ch-1",
        broadcast: true,
      });

      expect(mockPublish).not.toHaveBeenCalled();
      expect(mockChannelGet).not.toHaveBeenCalled();
    });

    it("should store metadata when provided", async () => {
      const metadata = { source: "github", event: "push" };
      mockPrisma.message.create.mockResolvedValue({
        id: "msg-1",
        channelId: "ch-1",
        userId: "system",
        content: "msg with metadata",
        messageType: "system",
        metadata,
        user: null,
      });
      mockGetAblyRest.mockReturnValue(null);

      await service.createSystemMessage("msg with metadata", {
        channelId: "ch-1",
        metadata,
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata }),
        })
      );
    });

    it("should include user in the database query", async () => {
      mockPrisma.message.create.mockResolvedValue({
        id: "msg-1",
        channelId: "ch-1",
        userId: "system",
        content: "test",
        messageType: "system",
        user: null,
      });
      mockGetAblyRest.mockReturnValue(null);

      await service.createSystemMessage("test", { channelId: "ch-1" });

      expect(mockPrisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({ include: { user: true } })
      );
    });

    it("should return the created message", async () => {
      const createdMessage = {
        id: "msg-42",
        channelId: "ch-7",
        userId: "system",
        content: "hello",
        messageType: "system",
        metadata: null,
        user: null,
      };
      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.createSystemMessage("hello", { channelId: "ch-7" });

      expect(result).toBe(createdMessage);
    });

    it("should broadcast to the correct channel id for different channel ids", async () => {
      const createdMessage = {
        id: "msg-99",
        channelId: "ch-99",
        userId: "system",
        content: "test",
        messageType: "system",
        user: null,
      };
      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockGetAblyRest.mockReturnValue({ channels: { get: mockChannelGet } });

      await service.createSystemMessage("test", { channelId: "ch-99" });

      expect(mockChannelGet).toHaveBeenCalledWith("channel:ch-99");
    });

    // Regression: was previously using thread() which was wrong
    it("should never call AblyChannels.thread when broadcasting", async () => {
      const createdMessage = {
        id: "msg-1",
        channelId: "ch-1",
        userId: "system",
        content: "regression test",
        messageType: "system",
        user: null,
      };
      mockPrisma.message.create.mockResolvedValue(createdMessage);
      mockGetAblyRest.mockReturnValue({ channels: { get: mockChannelGet } });

      const shared = await import("@repo/shared/server");
      const threadSpy = vi.spyOn(shared.AblyChannels, "thread");

      await service.createSystemMessage("regression test", { channelId: "ch-1" });

      expect(threadSpy).not.toHaveBeenCalled();
    });
  });
});