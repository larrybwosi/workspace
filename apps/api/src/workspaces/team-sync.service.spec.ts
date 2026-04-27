import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { TeamSyncService } from "./team-sync.service";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    workspaceTeam: {
      findUnique: vi.fn(),
    },
    channelMember: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@repo/database";

describe("TeamSyncService", () => {
  let service: TeamSyncService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamSyncService],
    }).compile();

    service = module.get<TeamSyncService>(TeamSyncService);
  });

  describe("syncTeamMemberToChannel", () => {
    it("should add member to channel when action is 'add'", async () => {
      const teamId = "team-1";
      const userId = "user-1";
      const channelId = "chan-1";

      mockPrisma.workspaceTeam.findUnique.mockResolvedValue({ id: teamId, channelId });

      await service.syncTeamMemberToChannel(teamId, userId, "add");

      expect(mockPrisma.channelMember.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { channelId_userId: { channelId, userId } }
      }));
    });

    it("should remove member from channel when action is 'remove'", async () => {
      const teamId = "team-1";
      const userId = "user-1";
      const channelId = "chan-1";

      mockPrisma.workspaceTeam.findUnique.mockResolvedValue({ id: teamId, channelId });

      await service.syncTeamMemberToChannel(teamId, userId, "remove");

      expect(mockPrisma.channelMember.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { channelId, userId }
      }));
    });
  });
});
