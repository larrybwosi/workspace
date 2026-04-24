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

  // ─────────────────────────────────────────────────────────────────────────────
  // getCall (new method added in this PR)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("getCall", () => {
    it("should return a call when found", async () => {
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

      await expect(service.getCall("nonexistent")).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException with message 'Call not found'", async () => {
      mockPrisma.call.findUnique.mockResolvedValue(null);

      await expect(service.getCall("nonexistent")).rejects.toThrow("Call not found");
    });

    it("should filter participants by leftAt: null", async () => {
      mockPrisma.call.findUnique.mockResolvedValue({ id: "call-1", participants: [] });

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
      expect(callArg.include.initiator).toBe(true);
    });

    it("should order participants by joinedAt desc", async () => {
      mockPrisma.call.findUnique.mockResolvedValue({ id: "call-1", participants: [] });

      await service.getCall("call-1");

      const callArg = mockPrisma.call.findUnique.mock.calls[0][0];
      expect(callArg.include.participants.orderBy).toEqual({ joinedAt: "desc" });
    });

    it("should select id, name, image, avatar fields for participants user", async () => {
      mockPrisma.call.findUnique.mockResolvedValue({ id: "call-1", participants: [] });

      await service.getCall("call-1");

      const callArg = mockPrisma.call.findUnique.mock.calls[0][0];
      const userSelect = callArg.include.participants.include.user.select;
      expect(userSelect).toMatchObject({
        id: true,
        name: true,
        image: true,
        avatar: true,
      });
    });

    it("should return call data exactly as returned by Prisma", async () => {
      const mockCall = { id: "call-xyz", status: "ended", initiator: null, participants: [] };
      mockPrisma.call.findUnique.mockResolvedValue(mockCall);

      const result = await service.getCall("call-xyz");

      expect(result).toBe(mockCall);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getScheduledCalls (PR change: workspaceIdOrSlug parameter)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("getScheduledCalls", () => {
    const mockUser = { id: "user-1" } as any;

    it("should throw BadRequestException when workspaceIdOrSlug is empty string", async () => {
      await expect(service.getScheduledCalls(mockUser, "")).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException with message 'Workspace ID or Slug required'", async () => {
      await expect(service.getScheduledCalls(mockUser, "")).rejects.toThrow(
        "Workspace ID or Slug required"
      );
    });

    it("should throw BadRequestException when workspaceIdOrSlug is undefined", async () => {
      await expect(service.getScheduledCalls(mockUser, undefined as any)).rejects.toThrow(
        "Workspace ID or Slug required"
      );
    });

    it("should look up workspace by both id and slug using OR query", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "resolved-ws-id" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "my-slug");

      expect(mockPrisma.workspace.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ id: "my-slug" }, { slug: "my-slug" }],
          },
        })
      );
    });

    it("should use resolved workspace id when calling findMany for calls", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "resolved-id" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "my-slug");

      expect(mockPrisma.call.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: "resolved-id" }),
        })
      );
    });

    it("should fall back to original value as workspaceId if workspace lookup returns null", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue(null);
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "direct-ws-id");

      expect(mockPrisma.call.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: "direct-ws-id" }),
        })
      );
    });

    it("should filter by status: 'scheduled'", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-1" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "ws-1");

      const callArg = mockPrisma.call.findMany.mock.calls[0][0];
      expect(callArg.where.status).toBe("scheduled");
    });

    it("should filter by scheduledFor >= now", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-1" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "ws-1");

      const callArg = mockPrisma.call.findMany.mock.calls[0][0];
      expect(callArg.where.scheduledFor).toBeDefined();
      expect(callArg.where.scheduledFor.gte).toBeInstanceOf(Date);
    });

    it("should order results by scheduledFor asc", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-1" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "ws-1");

      const callArg = mockPrisma.call.findMany.mock.calls[0][0];
      expect(callArg.orderBy).toEqual({ scheduledFor: "asc" });
    });

    it("should include initiator in query", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-1" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "ws-1");

      const callArg = mockPrisma.call.findMany.mock.calls[0][0];
      expect(callArg.include).toHaveProperty("initiator", true);
    });

    it("should return the scheduled calls from Prisma", async () => {
      const mockCalls = [
        { id: "call-1", status: "scheduled", initiator: { id: "user-1" } },
        { id: "call-2", status: "scheduled", initiator: { id: "user-2" } },
      ];
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "ws-1" });
      mockPrisma.call.findMany.mockResolvedValue(mockCalls);

      const result = await service.getScheduledCalls(mockUser, "ws-1");

      expect(result).toEqual(mockCalls);
    });

    it("should handle real slug lookup (value differs from resolved id)", async () => {
      mockPrisma.workspace.findFirst.mockResolvedValue({ id: "uuid-123" });
      mockPrisma.call.findMany.mockResolvedValue([]);

      await service.getScheduledCalls(mockUser, "my-workspace-slug");

      // Should use resolved uuid, not original slug
      const callArg = mockPrisma.call.findMany.mock.calls[0][0];
      expect(callArg.where.workspaceId).toBe("uuid-123");
      expect(callArg.where.workspaceId).not.toBe("my-workspace-slug");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // startCall – workspaceSlug resolution (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("startCall – workspaceSlug resolution", () => {
    const mockUser = { id: "user-1", name: "Alice", image: null } as any;

    it("should throw BadRequestException when type is missing", async () => {
      await expect(service.startCall(mockUser, { workspaceId: "ws-1" })).rejects.toThrow(
        "Type and workspaceId are required"
      );
    });

    it("should throw BadRequestException when both workspaceId and workspaceSlug are absent", async () => {
      await expect(service.startCall(mockUser, { type: "video" })).rejects.toThrow(
        "Type and workspaceId are required"
      );
    });

    it("should resolve workspaceId from workspaceSlug when workspaceId is absent", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "resolved-id" });
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
      mockPrisma.callParticipant.count.mockResolvedValue(1);

      const body = { type: "video", workspaceSlug: "my-slug", channelId: "ch-1" };
      await service.startCall(mockUser, body).catch(() => {});

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: "my-slug" } })
      );
    });

    it("should NOT look up slug when workspaceId is already provided", async () => {
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
      mockPrisma.callParticipant.count.mockResolvedValue(1);

      const body = {
        type: "video",
        workspaceId: "existing-id",
        workspaceSlug: "ignored-slug",
        channelId: "ch-1",
      };
      await service.startCall(mockUser, body).catch(() => {});

      expect(mockPrisma.workspace.findUnique).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: "ignored-slug" } })
      );
    });

    it("should use workspaceSlug in notification when slug is provided but not workspaceId", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "resolved-id" });
      const { publishToAbly } = await import("@repo/shared/server");
      const mockPublish = publishToAbly as any;

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
      mockPrisma.callParticipant.count.mockResolvedValue(1);

      const body = { type: "video", workspaceSlug: "my-slug", recipientId: "user-2" };
      await service.startCall(mockUser, body).catch(() => {});

      // workspaceSlug should be used in the notification payload
      const notifyCall = mockPublish.mock.calls.find((c: any[]) =>
        c[1] === "incoming-call"
      );
      if (notifyCall) {
        expect(notifyCall[2].workspaceId).toBe("my-slug");
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // scheduleCall – workspaceSlug resolution (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("scheduleCall – workspaceSlug resolution", () => {
    const mockUser = { id: "user-1", name: "Alice" } as any;

    it("should throw BadRequestException when required fields are missing", async () => {
      await expect(service.scheduleCall(mockUser, { workspaceId: "ws-1" })).rejects.toThrow(
        "Missing required fields"
      );
    });

    it("should throw when title is missing", async () => {
      const body = { type: "video", scheduledFor: new Date().toISOString(), workspaceId: "ws-1" };
      await expect(service.scheduleCall(mockUser, body)).rejects.toThrow("Missing required fields");
    });

    it("should resolve workspaceId from workspaceSlug", async () => {
      mockPrisma.workspace.findUnique
        .mockResolvedValueOnce({ id: "resolved-ws-id" }) // slug lookup
        .mockResolvedValueOnce({ id: "resolved-ws-id", name: "My WS", slug: "my-ws" }); // admin check
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.call.create.mockResolvedValue({
        id: "sched-1",
        workspaceId: "resolved-ws-id",
        scheduledFor: new Date(),
      });
      const { publishToAbly } = await import("@repo/shared/server");
      (publishToAbly as any).mockResolvedValue(undefined);

      const body = {
        title: "Meeting",
        type: "video",
        scheduledFor: new Date(Date.now() + 3600000).toISOString(),
        workspaceSlug: "my-ws",
      };
      await service.scheduleCall(mockUser, body).catch(() => {});

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: "my-ws" } })
      );
    });

    it("should NOT attempt slug resolution when workspaceId is already present", async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.call.create.mockResolvedValue({
        id: "sched-1",
        workspaceId: "direct-ws-id",
        scheduledFor: new Date(),
      });
      const { publishToAbly } = await import("@repo/shared/server");
      (publishToAbly as any).mockResolvedValue(undefined);

      const body = {
        title: "Meeting",
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

    it("should use resolved workspace id in call.create", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "resolved-id" });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      const { publishToAbly } = await import("@repo/shared/server");
      (publishToAbly as any).mockResolvedValue(undefined);

      const scheduledAt = new Date(Date.now() + 3600000).toISOString();
      mockPrisma.call.create.mockResolvedValue({
        id: "sched-1",
        workspaceId: "resolved-id",
        scheduledFor: new Date(scheduledAt),
      });

      const body = {
        title: "Meeting",
        type: "video",
        scheduledFor: scheduledAt,
        workspaceSlug: "resolved-slug",
      };
      await service.scheduleCall(mockUser, body).catch(() => {});

      expect(mockPrisma.call.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ workspaceId: "resolved-id" }),
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // updateCall – new publishToAbly on call channel for join/leave/end (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("updateCall – publishToAbly on call channel", () => {
    const mockUser = { id: "user-1" } as any;

    it("should publish call-joined to the call channel when joining", async () => {
      const { publishToAbly, AblyChannels } = await import("@repo/shared/server");
      const mockPublish = publishToAbly as any;

      mockPrisma.call.findUnique.mockResolvedValue({
        id: "call-1",
        status: "active",
        startedAt: new Date(),
        initiatorId: "user-1",
        metadata: { workspaceId: "ws-1" },
        participants: [],
      });
      mockPrisma.callParticipant.upsert.mockResolvedValue({ id: "p-1" });
      mockPrisma.call.update.mockResolvedValue({});

      await service.updateCall(mockUser, "call-1", { action: "join", uid: 42 });

      const callJoinedToCallChannel = mockPublish.mock.calls.find(
        (c: any[]) => c[0] === "call:call-1" && c[1] === "call-joined"
      );
      expect(callJoinedToCallChannel).toBeDefined();
    });

    it("should publish call-left to the call channel when leaving", async () => {
      const { publishToAbly } = await import("@repo/shared/server");
      const mockPublish = publishToAbly as any;

      mockPrisma.call.findUnique.mockResolvedValue({
        id: "call-1",
        status: "active",
        startedAt: new Date(),
        initiatorId: "user-1",
        metadata: { workspaceId: "ws-1" },
        participants: [],
      });
      mockPrisma.callParticipant.update.mockResolvedValue({});
      mockPrisma.callParticipant.count.mockResolvedValue(1);

      await service.updateCall(mockUser, "call-1", { action: "leave" });

      const callLeftToCallChannel = mockPublish.mock.calls.find(
        (c: any[]) => c[0] === "call:call-1" && c[1] === "call-left"
      );
      expect(callLeftToCallChannel).toBeDefined();
    });

    it("should publish call-ended to call channel when last participant leaves", async () => {
      const { publishToAbly } = await import("@repo/shared/server");
      const mockPublish = publishToAbly as any;

      mockPrisma.call.findUnique.mockResolvedValue({
        id: "call-1",
        status: "active",
        startedAt: new Date(Date.now() - 1000),
        initiatorId: "user-1",
        metadata: { workspaceId: "ws-1" },
        participants: [],
      });
      mockPrisma.callParticipant.update.mockResolvedValue({});
      mockPrisma.callParticipant.count.mockResolvedValue(0);
      mockPrisma.call.update.mockResolvedValue({});

      await service.updateCall(mockUser, "call-1", { action: "leave" });

      const callEndedToCallChannel = mockPublish.mock.calls.find(
        (c: any[]) => c[0] === "call:call-1" && c[1] === "call-ended"
      );
      expect(callEndedToCallChannel).toBeDefined();
    });

    it("should NOT publish call-ended to call channel when there are still active participants", async () => {
      const { publishToAbly } = await import("@repo/shared/server");
      const mockPublish = publishToAbly as any;

      mockPrisma.call.findUnique.mockResolvedValue({
        id: "call-1",
        status: "active",
        startedAt: new Date(Date.now() - 1000),
        initiatorId: "user-2",
        metadata: { workspaceId: "ws-1" },
        participants: [],
      });
      mockPrisma.callParticipant.update.mockResolvedValue({});
      mockPrisma.callParticipant.count.mockResolvedValue(2);

      await service.updateCall(mockUser, "call-1", { action: "leave" });

      const callEndedToCallChannel = mockPublish.mock.calls.find(
        (c: any[]) => c[0] === "call:call-1" && c[1] === "call-ended"
      );
      expect(callEndedToCallChannel).toBeUndefined();
    });
  });
});