import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { V2ApplicationsService } from "./applications.service";
import { NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    user: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    botApplication: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    workspaceTeam: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    channel: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    workspaceTeamMember: {
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    channelMember: {
      createMany: vi.fn(),
      upsert: vi.fn(),
    }
  },
}));

vi.mock("@repo/shared/server", () => ({
  notifyAppExclusive: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@repo/database";

describe("V2ApplicationsService", () => {
  let service: V2ApplicationsService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [V2ApplicationsService],
    }).compile();

    service = module.get<V2ApplicationsService>(V2ApplicationsService);
  });

  describe("installBot with channel definitions", () => {
    const userId = "user-1";
    const appId = "app-1";
    const workspaceId = "ws-1";
    const botId = "bot-1";

    it("should create teams and channels based on definitions", async () => {
      const channelDefinitions = [
        {
          teamName: "Owners",
          channelName: "owner-chat",
          autoPopulateRoles: ["owner"]
        }
      ];

      mockPrisma.botApplication.findUnique.mockResolvedValue({
        id: appId,
        botId,
        isGlobal: true,
        channelDefinitions,
        name: "Test App"
      });

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        members: [{ userId, role: "owner", permissions: String(1n << 3n) }]
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce(null); // Bot not yet in workspace
      mockPrisma.workspaceMember.create.mockResolvedValue({ id: "mem-bot" });

      mockPrisma.workspaceTeam.findUnique.mockResolvedValue(null);
      mockPrisma.workspaceTeam.create.mockResolvedValue({ id: "team-1" });

      mockPrisma.channel.findUnique.mockResolvedValue(null);
      mockPrisma.channel.create.mockResolvedValue({ id: "chan-1" });

      mockPrisma.workspaceMember.findMany.mockResolvedValue([
        { userId: "owner-1", role: "owner" }
      ]);

      await service.installBot(userId, appId, workspaceId);

      expect(mockPrisma.workspaceTeam.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: "Owners",
          appId: appId
        })
      }));

      expect(mockPrisma.channel.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: "owner-chat",
          appId: appId,
          type: "private"
        })
      }));

      expect(mockPrisma.workspaceTeamMember.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { teamId_userId: { teamId: "team-1", userId: botId } }
      }));

      expect(mockPrisma.channelMember.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { channelId_userId: { channelId: "chan-1", userId: botId } }
      }));

      expect(mockPrisma.workspaceTeamMember.createMany).toHaveBeenCalled();
      expect(mockPrisma.channelMember.createMany).toHaveBeenCalled();
    });
  });
});
