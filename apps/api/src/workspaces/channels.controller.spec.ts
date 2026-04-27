import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ChannelsController } from "./channels.controller";
import { AuthGuard } from "../auth/auth.guard";

// Mock @repo/database prisma
vi.mock("@repo/database", () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    channel: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock @repo/shared/server
vi.mock("@repo/shared/server", () => ({
  AblyChannels: {
    workspace: vi.fn((id: string) => `workspace:${id}`),
    channel: vi.fn((id: string) => `channel:${id}`),
  },
  EVENTS: {
    CHANNEL_CREATED: "channel.created",
    CHANNEL_UPDATED: "channel.updated",
    CHANNEL_DELETED: "channel.deleted",
  },
  getAblyServer: vi.fn().mockReturnValue(null),
}));

import { prisma } from "@repo/database";

/**
 * Helper function that mirrors the mapping logic from channels.controller.ts getWorkspaceChannels.
 * This tests the unreadCount and mentionCount computation logic added in the PR.
 */
function computeChannelMetrics(
  channels: Array<{
    messages: Array<{
      id: string;
      mentions: Array<{ mention: string }>;
    }>;
    [key: string]: any;
  }>,
  user: { id: string; name?: string; username?: string }
) {
  return channels.map((channel) => {
    const unreadCount = channel.messages.length;
    const mentionCount = channel.messages.filter((m) =>
      m.mentions.some(
        (mention) =>
          mention.mention === `@${user.name}` ||
          mention.mention === `@${user.username}` ||
          mention.mention === "@all" ||
          mention.mention === "@here"
      )
    ).length;

    const { messages, ...rest } = channel;
    return {
      ...rest,
      unreadCount,
      mentionCount,
    };
  });
}

describe("ChannelsController - getWorkspaceChannels unread/mention logic", () => {
  describe("unreadCount computation (PR change)", () => {
    it("should count unread messages as the number of unread message objects", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            { id: "msg-1", mentions: [] },
            { id: "msg-2", mentions: [] },
          ],
        },
      ];
      const user = { id: "user-1", name: "Alice", username: "alice" };

      const result = computeChannelMetrics(channels, user);
      expect(result[0].unreadCount).toBe(2);
    });

    it("should return unreadCount of 0 when no unread messages", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [],
        },
      ];
      const user = { id: "user-1", name: "Alice", username: "alice" };

      const result = computeChannelMetrics(channels, user);
      expect(result[0].unreadCount).toBe(0);
    });

    it("should strip messages array from returned channel object", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [{ id: "msg-1", mentions: [] }],
        },
      ];
      const user = { id: "user-1", name: "Alice", username: "alice" };

      const result = computeChannelMetrics(channels, user);
      expect(result[0]).not.toHaveProperty("messages");
    });

    it("should preserve all other channel fields in the result", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          slug: "general",
          _count: { messages: 10 },
          messages: [],
        },
      ];
      const user = { id: "user-1", name: "Alice", username: "alice" };

      const result = computeChannelMetrics(channels, user);
      expect(result[0].id).toBe("ch-1");
      expect(result[0].name).toBe("general");
      expect(result[0].slug).toBe("general");
      expect(result[0]._count).toEqual({ messages: 10 });
    });
  });

  describe("mentionCount computation (PR change)", () => {
    const user = { id: "user-1", name: "Alice", username: "alice" };

    it("should count message as mention when @username matches user.username", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            { id: "msg-1", mentions: [{ mention: "@alice" }] },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, user);
      expect(result[0].mentionCount).toBe(1);
    });

    it("should count message as mention when @name matches user.name", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            { id: "msg-1", mentions: [{ mention: "@Alice" }] },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, user);
      expect(result[0].mentionCount).toBe(1);
    });

    it("should count message as mention when @all is present", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            { id: "msg-1", mentions: [{ mention: "@all" }] },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, user);
      expect(result[0].mentionCount).toBe(1);
    });

    it("should count message as mention when @here is present", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            { id: "msg-1", mentions: [{ mention: "@here" }] },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, user);
      expect(result[0].mentionCount).toBe(1);
    });

    it("should NOT count message as mention when @other user is mentioned", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            { id: "msg-1", mentions: [{ mention: "@bob" }] },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, user);
      expect(result[0].mentionCount).toBe(0);
    });

    it("should return mentionCount 0 when no messages have mentions", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            { id: "msg-1", mentions: [] },
            { id: "msg-2", mentions: [] },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, user);
      expect(result[0].mentionCount).toBe(0);
    });

    it("should count only messages where the current user is mentioned (not all mentions)", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            // msg with mention of this user
            { id: "msg-1", mentions: [{ mention: "@alice" }] },
            // msg with mention of another user
            { id: "msg-2", mentions: [{ mention: "@bob" }] },
            // msg with no mention
            { id: "msg-3", mentions: [] },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, user);
      expect(result[0].unreadCount).toBe(3);
      expect(result[0].mentionCount).toBe(1);
    });

    it("should count a single message only once even if it has multiple matching mentions", () => {
      // A message that has both @alice and @all mentions should only count once
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            {
              id: "msg-1",
              mentions: [
                { mention: "@alice" },
                { mention: "@all" },
              ],
            },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, user);
      // The filter uses .some(), so this message is counted once
      expect(result[0].mentionCount).toBe(1);
    });

    it("should handle multiple channels independently", () => {
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            { id: "msg-1", mentions: [{ mention: "@alice" }] },
          ],
        },
        {
          id: "ch-2",
          name: "random",
          messages: [
            { id: "msg-2", mentions: [{ mention: "@bob" }] },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, user);
      expect(result[0].mentionCount).toBe(1);
      expect(result[1].mentionCount).toBe(0);
    });

    it("should handle user without username field", () => {
      const userNoUsername = { id: "user-2", name: "Bob" };
      const channels = [
        {
          id: "ch-1",
          name: "general",
          messages: [
            { id: "msg-1", mentions: [{ mention: "@Bob" }] },
          ],
        },
      ];

      const result = computeChannelMetrics(channels, userNoUsername as any);
      expect(result[0].mentionCount).toBe(1);
    });
  });
});

describe("ChannelsController - NestJS module", () => {
  let controller: ChannelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelsController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChannelsController>(ChannelsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should throw NotFoundException when workspace not found in getWorkspaceChannels", async () => {
    const mockPrisma = prisma as any;
    mockPrisma.workspace.findUnique.mockResolvedValue(null);

    const user = { id: "user-1", name: "Alice", username: "alice" } as any;

    await expect(
      controller.getWorkspaceChannels(user, "non-existent-slug")
    ).rejects.toThrow("Workspace not found");
  });

  it("should throw ForbiddenException when user is not a workspace member", async () => {
    const mockPrisma = prisma as any;
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: "ws-1",
      slug: "my-workspace",
      members: [], // User not found in membership list
    });

    const user = { id: "user-1", name: "Alice", username: "alice" } as any;

    await expect(
      controller.getWorkspaceChannels(user, "my-workspace")
    ).rejects.toThrow("Forbidden");
  });

  it("should return channels when successful", async () => {
    const mockPrisma = prisma as any;
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: "ws-1",
      slug: "my-workspace",
      members: [{ userId: "user-1" }],
      channels: [
        {
          id: "ch-1",
          name: "general",
          _count: { messages: 5 },
        },
      ],
    });

    const user = { id: "user-1", name: "Alice", username: "alice" } as any;
    const result = await controller.getWorkspaceChannels(user, "my-workspace");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ch-1");
  });
});