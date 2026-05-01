import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { V10ChannelsService } from "./channels.service";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    channel: {
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
    }
  },
}));

vi.mock("@repo/shared/server", () => ({
  publishToAbly: vi.fn().mockResolvedValue(undefined),
  notifyAppExclusive: vi.fn().mockResolvedValue(undefined),
  AblyChannels: {
    channel: vi.fn((id: string) => `channel:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: "MESSAGE_SENT",
  },
}));

import { prisma } from "@repo/database";
import { notifyAppExclusive } from "@repo/shared/server";

describe("V10ChannelsService", () => {
  let service: V10ChannelsService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [V10ChannelsService],
    }).compile();

    service = module.get<V10ChannelsService>(V10ChannelsService);
  });

  describe("createMessage with exclusive notification", () => {
    it("should trigger exclusive notification when appId is present", async () => {
      const bot = { id: "bot-1", name: "TestBot" };
      const channelId = "chan-1";
      const messageData = {
        content: "Hello",
        exclusive_notification: {
          title: "Alert",
          message: "Important"
        }
      };

      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        appId: "app-1",
        workspaceId: "ws-1",
        members: [{ userId: "bot-1", permissions: String(1n << 11n) }], // SEND_MESSAGES
        workspace: {
            slug: "test-ws",
            members: []
        }
      });

      mockPrisma.message.create.mockResolvedValue({
        id: "msg-1",
        content: "Hello",
        channelId,
        timestamp: new Date()
      });

      await service.createMessage(bot, channelId, messageData);

      expect(notifyAppExclusive).toHaveBeenCalledWith(
        channelId,
        "Alert",
        "Important",
        expect.stringContaining("msg-1"),
        expect.anything()
      );
    });
  });
});
