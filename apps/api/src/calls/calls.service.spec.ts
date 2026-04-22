import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CallsService } from "./calls.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

// Mock agora-token (CJS default export style)
vi.mock("agora-token", () => ({
  default: {
    RtcTokenBuilder: {
      buildTokenWithUid: vi.fn().mockReturnValue("mock_agora_token"),
    },
    RtcRole: {
      PUBLISHER: 1,
    },
  },
}));

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    call: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    callParticipant: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    channel: {
      findUnique: vi.fn(),
    },
    channelMember: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    directMessage: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock @repo/shared/server
vi.mock("@repo/shared/server", () => ({
  agoraServerConfig: {
    appId: "test_app_id",
    appCertificate: "test_cert",
  },
  publishToAbly: vi.fn().mockResolvedValue(undefined),
  AblyChannels: {
    user: vi.fn((id: string) => `user:${id}`),
    call: vi.fn((id: string) => `call:${id}`),
    workspace: vi.fn((id: string) => `workspace:${id}`),
    channel: vi.fn((id: string) => `channel:${id}`),
    notifications: vi.fn((id: string) => `notifications:${id}`),
  },
  AblyEvents: {
    CALL_STARTED: "call-started",
    CALL_ENDED: "call-ended",
    NOTIFICATION: "NOTIFICATION",
    SOUNDBOARD_PLAYED: "soundboard-played",
  },
  isUserEligibleForAsset: vi.fn().mockResolvedValue(true),
  logAssetUsage: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@repo/database";

describe("CallsService", () => {
  let service: CallsService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CallsService],
    }).compile();

    service = module.get<CallsService>(CallsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCall - new method", () => {
    it("should return a call with participants when found", async () => {
      const mockCall = {
        id: "call-1",
        type: "video",
        status: "active",
        initiator: { id: "user-1", name: "Alice" },
        participants: [
          {
            userId: "user-1",
            leftAt: null,
            user: { id: "user-1", name: "Alice", image: null, avatar: null },
            joinedAt: new Date(),
          },
        ],
      };
      mockPrisma.call.findUnique.mockResolvedValue(mockCall);

      const result = await service.getCall("call-1");

      expect(result).toEqual(mockCall);
      expect(mockPrisma.call.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "call-1" },
        })
      );
    });

    it("should throw NotFoundException when call is not found", async () => {
      mockPrisma.call.findUnique.mockResolvedValue(null);

      await expect(service.getCall("nonexistent-call")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw NotFoundException with message 'Call not found'", async () => {
      mockPrisma.call.findUnique.mockResolvedValue(null);

      await expect(service.getCall("nonexistent-call")).rejects.toThrow(
        "Call not found"
      );
    });

    it("should include participants filtered by leftAt: null", async () => {
      mockPrisma.call.findUnique.mockResolvedValue({
        id: "call-1",
        participants: [],
      });

      await service.getCall("call-1");

      const callArg = mockPrisma.call.findUnique.mock.calls[0][0];
      expect(callArg.include.participants.where).toEqual({ leftAt: null });
    });

    it("should include initiator in the query", async () => {
      mockPrisma.call.findUnique.mockResolvedValue({
        id: "call-1",
        initiator: { id: "user-1" },
        participants: [],
      });

      await service.getCall("call-1");

      const callArg = mockPrisma.call.findUnique.mock.calls[0][0];
      expect(callArg.include).toHaveProperty("initiator");
      expect(callArg.include.initiator).toBe(true);
    });

    it("should order participants by joinedAt desc", async () => {
      mockPrisma.call.findUnique.mockResolvedValue({
        id: "call-1",
        participants: [],
      });

      await service.getCall("call-1");

      const callArg = mockPrisma.call.findUnique.mock.calls[0][0];
      expect(callArg.include.participants.orderBy).toEqual({ joinedAt: "desc" });
    });

    it("should include user fields for participants: id, name, image, avatar", async () => {
      mockPrisma.call.findUnique.mockResolvedValue({
        id: "call-1",
        participants: [],
      });

      await service.getCall("call-1");

      const callArg = mockPrisma.call.findUnique.mock.calls[0][0];
      const userSelect = callArg.include.participants.include.user.select;
      expect(userSelect).toHaveProperty("id", true);
      expect(userSelect).toHaveProperty("name", true);
      expect(userSelect).toHaveProperty("image", true);
      expect(userSelect).toHaveProperty("avatar", true);
    });
  });

  describe("getScheduledCalls - workspaceIdOrSlug support", () => {
    const mockUser = { id: "user-1" } as any;

    it("should throw BadRequestException when workspaceIdOrSlug is empty string", async () => {
      await expect(
        service.getScheduledCalls(mockUser, "")
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException with 'Workspace ID or Slug required'", async () => {
      await expect(
        service.getScheduledCalls(mockUser, "")
      ).rejects.toThrow("Workspace ID or Slug required");
    });

    it("should throw BadRequestException when workspaceIdOrSlug is undefined", async () => {
      await expect(
        service.getScheduledCalls(mockUser, undefined as any)
      ).rejects.toThrow("Workspace ID or Slug required");
    });

    it("should resolve workspace by slug using OR [id, slug] query", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-resolved-id" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "my-workspace-slug");

      expect(mockPrisma.workspace.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { id: "my-workspace-slug" },
              { slug: "my-workspace-slug" },
            ],
          },
        })
      );
    });

    it("should use the resolved workspace ID when querying calls", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "resolved-ws-id" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "my-workspace-slug");

      expect(mockPrisma.call.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: "resolved-ws-id",
          }),
        })
      );
    });

    it("should use the original value as workspaceId if workspace lookup returns null", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "ws-direct-id");

      expect(mockPrisma.call.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: "ws-direct-id",
          }),
        })
      );
    });

    it("should filter calls by status: 'scheduled' and future scheduledFor dates", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-1" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "ws-1");

      const callArg = mockPrisma.call.findMany.mock.calls[0][0];
      expect(callArg.where.status).toBe("scheduled");
      expect(callArg.where.scheduledFor).toBeDefined();
      expect(callArg.where.scheduledFor.gte).toBeInstanceOf(Date);
    });

    it("should return scheduled calls", async () => {
      const mockCalls = [
        { id: "call-1", status: "scheduled", initiator: { id: "user-1" } },
      ];
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-1" });
      mockPrisma.call.findMany.mockResolvedValue(mockCalls);

      const result = await service.getScheduledCalls(mockUser, "ws-1");

      expect(result).toEqual(mockCalls);
    });

    it("should include initiator in the query", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-1" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "ws-1");

      const callArg = mockPrisma.call.findMany.mock.calls[0][0];
      expect(callArg.include).toHaveProperty("initiator", true);
    });

    it("should order results by scheduledFor asc", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-1" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "ws-1");

      const callArg = mockPrisma.call.findMany.mock.calls[0][0];
      expect(callArg.orderBy).toEqual({ scheduledFor: "asc" });
    });
  });

  describe("startCall - workspaceSlug resolution", () => {
    const mockUser = { id: "user-1", name: "Alice", image: null } as any;

    it("should throw BadRequestException when type is missing", async () => {
      const body = { workspaceId: "ws-1" };

      await expect(service.startCall(mockUser, body)).rejects.toThrow(
        "Type and workspaceId are required"
      );
    });

    it("should throw BadRequestException when both workspaceId and workspaceSlug are missing", async () => {
      const body = { type: "video" };

      await expect(service.startCall(mockUser, body)).rejects.toThrow(
        "Type and workspaceId are required"
      );
    });

    it("should resolve workspaceId from workspaceSlug when workspaceId is not provided", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "resolved-ws-id" });

      const body = {
        type: "video",
        workspaceSlug: "my-workspace-slug",
        channelId: "ch-1",
      };

      // The service will fail after workspace lookup due to other mocks,
      // but we verify the slug lookup was called
      mockPrisma.call.findFirst.mockResolvedValue(null);
      mockPrisma.call.create.mockResolvedValue({
        id: "new-call",
        channelName: "channel-ch-1",
        type: "video",
        status: "active",
        metadata: {},
        startedAt: new Date(),
        participants: [],
        initiatorId: "user-1",
      });
      mockPrisma.callParticipant.upsert.mockResolvedValue({ id: "p-1" });

      await service.startCall(mockUser, body).catch(() => {});

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: "my-workspace-slug" },
        })
      );
    });

    it("should not resolve from slug when workspaceId is already provided", async () => {
      const body = {
        type: "video",
        workspaceId: "existing-ws-id",
        workspaceSlug: "some-slug",
        channelId: "ch-1",
      };

      mockPrisma.call.findFirst.mockResolvedValue(null);
      mockPrisma.call.create.mockResolvedValue({
        id: "new-call",
        channelName: "channel-ch-1",
        type: "video",
        status: "active",
        metadata: {},
        startedAt: new Date(),
        participants: [],
        initiatorId: "user-1",
      });
      mockPrisma.callParticipant.upsert.mockResolvedValue({ id: "p-1" });

      await service.startCall(mockUser, body).catch(() => {});

      // workspace.findUnique should NOT be called for slug resolution when workspaceId is present
      expect(mockPrisma.workspace.findUnique).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: "some-slug" },
        })
      );
    });
  });

  describe("scheduleCall - workspaceSlug resolution", () => {
    const mockUser = { id: "user-1", name: "Alice" } as any;

    it("should throw BadRequestException when required fields are missing", async () => {
      const body = { workspaceId: "ws-1" };

      await expect(service.scheduleCall(mockUser, body)).rejects.toThrow(
        "Missing required fields"
      );
    });

    it("should resolve workspaceId from workspaceSlug", async () => {
      mockPrisma.workspace.findUnique
        .mockResolvedValueOnce({ id: "resolved-ws-id" }) // slug resolution
        .mockResolvedValueOnce({ id: "resolved-ws-id", name: "My Workspace", slug: "my-workspace" }); // admin check

      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.call.create.mockResolvedValue({
        id: "sched-call-1",
        workspaceId: "resolved-ws-id",
        scheduledFor: new Date(),
      });

      const body = {
        title: "Team Meeting",
        type: "video",
        scheduledFor: new Date(Date.now() + 3600000).toISOString(),
        workspaceSlug: "my-workspace",
      };

      await service.scheduleCall(mockUser, body).catch(() => {});

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: "my-workspace" },
        })
      );
    });

    it("should not attempt slug resolution when workspaceId is already present", async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.call.create.mockResolvedValue({
        id: "sched-call-1",
        workspaceId: "direct-ws-id",
        scheduledFor: new Date(),
      });

      const body = {
        title: "Team Meeting",
        type: "video",
        scheduledFor: new Date(Date.now() + 3600000).toISOString(),
        workspaceId: "direct-ws-id",
        workspaceSlug: "should-not-be-used",
      };

      await service.scheduleCall(mockUser, body).catch(() => {});

      expect(mockPrisma.workspace.findUnique).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: "should-not-be-used" } })
      );
    });
  });
});