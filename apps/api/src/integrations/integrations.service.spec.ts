import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { IntegrationsService } from "./integrations.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { SystemMessagesService } from "../common/system-messages.service";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    workspaceIntegration: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    channel: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    webhookDelivery: {
      create: vi.fn(),
    },
    workspaceWebhook: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@repo/shared/server", () => ({
  publishToAbly: vi.fn().mockResolvedValue(undefined),
  AblyChannels: {
    workspace: vi.fn((id: string) => `workspace:${id}`),
    channel: vi.fn((id: string) => `channel:${id}`),
  },
  AblyEvents: {
    NOTIFICATION: "NOTIFICATION",
  },
  getAblyRest: vi.fn().mockReturnValue(null),
}));

import { prisma } from "@repo/database";

describe("IntegrationsService - GitHub integration (PR change)", () => {
  let service: IntegrationsService;
  const mockPrisma = prisma as any;

  const mockSystemMessagesService = {
    createSystemMessage: vi.fn().mockResolvedValue({ id: "sys-msg-1" }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        {
          provide: SystemMessagesService,
          useValue: mockSystemMessagesService,
        },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
  });

  describe("getGithubAuthUrl (PR change)", () => {
    it("should return a GitHub authorization URL", async () => {
      process.env.GITHUB_CLIENT_ID = "test_client_id";
      process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

      const result = await service.getGithubAuthUrl("user-1", "my-workspace");

      expect(result).toHaveProperty("url");
      expect(result.url).toContain("https://github.com/login/oauth/authorize");
    });

    it("should include the client_id in the URL", async () => {
      process.env.GITHUB_CLIENT_ID = "my_github_client_id";
      process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

      const result = await service.getGithubAuthUrl("user-1", "my-workspace");

      expect(result.url).toContain("client_id=my_github_client_id");
    });

    it("should include required scopes in the URL", async () => {
      process.env.GITHUB_CLIENT_ID = "test_id";
      process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

      const result = await service.getGithubAuthUrl("user-1", "my-workspace");

      expect(result.url).toContain("scope=repo%2Cread%3Auser%2Cworkflow");
    });

    it("should include the workspace slug as state parameter", async () => {
      process.env.GITHUB_CLIENT_ID = "test_id";
      process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

      const result = await service.getGithubAuthUrl("user-1", "test-workspace");

      expect(result.url).toContain("state=test-workspace");
    });

    it("should include encoded redirect URI containing workspace slug", async () => {
      process.env.GITHUB_CLIENT_ID = "test_id";
      process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

      const result = await service.getGithubAuthUrl("user-1", "test-workspace");

      expect(result.url).toContain("redirect_uri=");
      expect(result.url).toContain("test-workspace");
    });
  });

  describe("handleGithubCallback (PR change)", () => {
    beforeEach(() => {
      process.env.GITHUB_CLIENT_ID = "test_client_id";
      process.env.GITHUB_CLIENT_SECRET = "test_client_secret";
    });

    it("should throw NotFoundException when workspace is not found", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.handleGithubCallback("user-1", "nonexistent-workspace", "code123")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on GitHub OAuth error", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1", slug: "my-workspace" });

      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ error: "bad_verification_code", error_description: "The code passed is incorrect" }),
        });
      global.fetch = mockFetch as any;

      await expect(
        service.handleGithubCallback("user-1", "my-workspace", "bad_code")
      ).rejects.toThrow("The code passed is incorrect");
    });

    it("should create a new integration when none exists", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1", slug: "my-workspace" });
      mockPrisma.workspaceIntegration.findFirst.mockResolvedValue(null);

      const createdIntegration = {
        id: "int-1",
        workspaceId: "ws-1",
        service: "github",
        active: true,
        config: { accessToken: "token123", githubId: 12345, githubLogin: "octocat" },
      };
      mockPrisma.workspaceIntegration.create.mockResolvedValue(createdIntegration);

      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ access_token: "token123" }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ id: 12345, login: "octocat" }),
        });
      global.fetch = mockFetch as any;

      const result = await service.handleGithubCallback("user-1", "my-workspace", "valid_code");

      expect(mockPrisma.workspaceIntegration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: "ws-1",
            service: "github",
            active: true,
          }),
        })
      );
      expect(result).toEqual(createdIntegration);
    });

    it("should update an existing integration when one already exists", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1", slug: "my-workspace" });
      mockPrisma.workspaceIntegration.findFirst.mockResolvedValue({
        id: "existing-int-1",
        workspaceId: "ws-1",
        service: "github",
      });

      const updatedIntegration = {
        id: "existing-int-1",
        workspaceId: "ws-1",
        service: "github",
        active: true,
        config: { accessToken: "new_token", githubId: 12345, githubLogin: "octocat" },
      };
      mockPrisma.workspaceIntegration.update.mockResolvedValue(updatedIntegration);

      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ access_token: "new_token" }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ id: 12345, login: "octocat" }),
        });
      global.fetch = mockFetch as any;

      const result = await service.handleGithubCallback("user-1", "my-workspace", "valid_code");

      expect(mockPrisma.workspaceIntegration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "existing-int-1" },
          data: expect.objectContaining({
            active: true,
          }),
        })
      );
      expect(mockPrisma.workspaceIntegration.create).not.toHaveBeenCalled();
      expect(result).toEqual(updatedIntegration);
    });
  });

  describe("handleGithubWebhook (PR change)", () => {
    it("should return { success: false } when workspace is not found", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      const result = await service.handleGithubWebhook("nonexistent-workspace", {});
      expect(result).toEqual({ success: false });
    });

    it("should return { success: false } when no 'general' channel exists", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1" });
      mockPrisma.channel.findFirst.mockResolvedValue(null);

      const result = await service.handleGithubWebhook("my-workspace", {});
      expect(result).toEqual({ success: false });
    });

    it("should create system message for pull_request event", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1" });
      mockPrisma.channel.findFirst.mockResolvedValue({ id: "ch-general" });

      const prBody = {
        action: "opened",
        pull_request: {
          title: "Fix bug",
          html_url: "https://github.com/owner/repo/pull/1",
        },
        sender: { login: "octocat" },
      };

      const result = await service.handleGithubWebhook("my-workspace", prBody);

      expect(mockSystemMessagesService.createSystemMessage).toHaveBeenCalledWith(
        expect.stringContaining("PR opened"),
        expect.objectContaining({
          channelId: "ch-general",
          metadata: expect.objectContaining({ source: "github", event: "opened" }),
          broadcast: true,
        })
      );
      expect(result).toEqual({ success: true });
    });

    it("should create system message for push event with commits", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1" });
      mockPrisma.channel.findFirst.mockResolvedValue({ id: "ch-general" });

      const pushBody = {
        commits: [{ id: "abc" }, { id: "def" }],
        repository: { full_name: "owner/repo" },
        sender: { login: "octocat" },
      };

      const result = await service.handleGithubWebhook("my-workspace", pushBody);

      expect(mockSystemMessagesService.createSystemMessage).toHaveBeenCalledWith(
        expect.stringContaining("Push to"),
        expect.objectContaining({
          channelId: "ch-general",
        })
      );
      expect(result).toEqual({ success: true });
    });

    it("should create system message for issue event", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1" });
      mockPrisma.channel.findFirst.mockResolvedValue({ id: "ch-general" });

      const issueBody = {
        action: "opened",
        issue: {
          title: "Bug report",
          html_url: "https://github.com/owner/repo/issues/1",
        },
        sender: { login: "octocat" },
      };

      const result = await service.handleGithubWebhook("my-workspace", issueBody);

      expect(mockSystemMessagesService.createSystemMessage).toHaveBeenCalledWith(
        expect.stringContaining("Issue opened"),
        expect.objectContaining({
          channelId: "ch-general",
        })
      );
      expect(result).toEqual({ success: true });
    });

    it("should NOT call createSystemMessage when event type is unrecognized", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1" });
      mockPrisma.channel.findFirst.mockResolvedValue({ id: "ch-general" });

      // Body with no known event fields
      const unknownBody = { action: "something", other_field: "value" };

      const result = await service.handleGithubWebhook("my-workspace", unknownBody);

      expect(mockSystemMessagesService.createSystemMessage).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("should include commit count in push message", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: "ws-1" });
      mockPrisma.channel.findFirst.mockResolvedValue({ id: "ch-general" });

      const pushBody = {
        commits: [{ id: "a" }, { id: "b" }, { id: "c" }],
        repository: { full_name: "owner/repo" },
        sender: { login: "dev" },
      };

      await service.handleGithubWebhook("my-workspace", pushBody);

      expect(mockSystemMessagesService.createSystemMessage).toHaveBeenCalledWith(
        expect.stringContaining("3 commits"),
        expect.anything()
      );
    });
  });
});