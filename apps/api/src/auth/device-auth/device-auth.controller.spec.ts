import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { DeviceAuthController } from "./device-auth.controller";

// Mock nanoid to return a predictable value
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-session-id-123"),
}));

// Mock Better-Auth
const { mockCreateSession } = vi.hoisted(() => ({
  mockCreateSession: vi.fn(),
}));

vi.mock("../better-auth", () => ({
  auth: {
    api: {
      createSession: mockCreateSession,
    },
  },
}));

// Mock @repo/shared/server
const { mockPublishToAbly } = vi.hoisted(() => ({
  mockPublishToAbly: vi.fn(),
}));

vi.mock("@repo/shared/server", () => ({
  publishToAbly: mockPublishToAbly,
}));

describe("DeviceAuthController", () => {
  let controller: DeviceAuthController;
  let mockRedis: {
    set: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockRedis = {
      set: vi.fn().mockResolvedValue("OK"),
      get: vi.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceAuthController],
      providers: [
        {
          provide: "REDIS_CLIENT",
          useValue: mockRedis,
        },
      ],
    }).compile();

    controller = module.get<DeviceAuthController>(DeviceAuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // generateQR – Redis-backed session (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("generateQR - Redis session creation", () => {
    it("should return a sessionId", async () => {
      const result = await controller.generateQR();

      expect(result).toHaveProperty("sessionId");
      expect(typeof result.sessionId).toBe("string");
    });

    it("should store the session in Redis with status: pending", async () => {
      await controller.generateQR();

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining("qr-session:"),
        JSON.stringify({ status: "pending" }),
        "EX",
        120
      );
    });

    it("should use key format qr-session:{sessionId}", async () => {
      const result = await controller.generateQR();

      expect(mockRedis.set).toHaveBeenCalledWith(
        `qr-session:${result.sessionId}`,
        expect.any(String),
        "EX",
        120
      );
    });

    it("should set TTL to 120 seconds", async () => {
      await controller.generateQR();

      const callArgs = mockRedis.set.mock.calls[0];
      expect(callArgs[2]).toBe("EX");
      expect(callArgs[3]).toBe(120);
    });

    it("should store initial status as pending in Redis", async () => {
      await controller.generateQR();

      const callArgs = mockRedis.set.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);
      expect(storedData).toEqual({ status: "pending" });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // checkStatus – Redis-backed status (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("checkStatus - Redis lookup", () => {
    it("should return { status: 'expired' } when session not found in Redis", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await controller.checkStatus("nonexistent-session");

      expect(result).toEqual({ status: "expired" });
    });

    it("should look up session using key format qr-session:{sessionId}", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));

      await controller.checkStatus("my-session-id");

      expect(mockRedis.get).toHaveBeenCalledWith("qr-session:my-session-id");
    });

    it("should return parsed session data when session exists", async () => {
      const sessionData = { status: "pending" };
      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

      const result = await controller.checkStatus("valid-session");

      expect(result).toEqual(sessionData);
    });

    it("should return authorized session data when session is authorized", async () => {
      const authorizedSession = {
        status: "authorized",
        userId: "user-1",
        token: "some-token",
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(authorizedSession));

      const result = await controller.checkStatus("authorized-session");

      expect(result).toEqual(authorizedSession);
    });

    it("should parse complex session objects from Redis correctly", async () => {
      const complexSession = {
        status: "authorized",
        userId: "user-123",
        token: "tok-abc",
        session: { id: "sess-456", userId: "user-123" },
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(complexSession));

      const result = await controller.checkStatus("session-abc");

      expect(result).toEqual(complexSession);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // authorize – Better-Auth session creation + Redis update + Ably notification (PR change)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("authorize - Better-Auth session + Redis + Ably", () => {
    const mockUser = { id: "user-1", email: "user@example.com" };

    it("should throw NotFoundException when session not found in Redis", async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        controller.authorize({ sessionId: "invalid-session" }, mockUser)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException with correct message when session not found", async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        controller.authorize({ sessionId: "invalid-session" }, mockUser)
      ).rejects.toThrow("Session not found or expired");
    });

    it("should throw UnauthorizedException when Better-Auth createSession returns null", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      mockCreateSession.mockResolvedValue(null);

      await expect(
        controller.authorize({ sessionId: "valid-session" }, mockUser)
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException with correct message when createSession fails", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      mockCreateSession.mockResolvedValue(null);

      await expect(
        controller.authorize({ sessionId: "valid-session" }, mockUser)
      ).rejects.toThrow("Could not create session");
    });

    it("should call auth.api.createSession with the user's id", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      mockCreateSession.mockResolvedValue({ token: "new-token", id: "sess-1" });
      mockPublishToAbly.mockResolvedValue(undefined);

      await controller.authorize({ sessionId: "valid-session" }, mockUser);

      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            userId: "user-1",
          },
        })
      );
    });

    it("should update Redis with authorized status, userId, and token", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      const newSession = { token: "new-auth-token", id: "sess-new" };
      mockCreateSession.mockResolvedValue(newSession);
      mockPublishToAbly.mockResolvedValue(undefined);

      await controller.authorize({ sessionId: "my-session" }, mockUser);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "qr-session:my-session",
        expect.any(String),
        "EX",
        120
      );

      const updatedDataArg = mockRedis.set.mock.calls[0][1];
      const updatedData = JSON.parse(updatedDataArg);
      expect(updatedData.status).toBe("authorized");
      expect(updatedData.userId).toBe("user-1");
      expect(updatedData.token).toBe("new-auth-token");
    });

    it("should store the full session object from Better-Auth in Redis", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      const newSession = { token: "session-token", id: "session-object-id", userId: "user-1" };
      mockCreateSession.mockResolvedValue(newSession);
      mockPublishToAbly.mockResolvedValue(undefined);

      await controller.authorize({ sessionId: "my-session" }, mockUser);

      const updatedDataArg = mockRedis.set.mock.calls[0][1];
      const updatedData = JSON.parse(updatedDataArg);
      expect(updatedData.session).toEqual(newSession);
    });

    it("should publish to Ably channel qr-session:{sessionId} with 'authorized' event", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      mockCreateSession.mockResolvedValue({ token: "auth-token", id: "sess-1" });
      mockPublishToAbly.mockResolvedValue(undefined);

      await controller.authorize({ sessionId: "ably-session" }, mockUser);

      expect(mockPublishToAbly).toHaveBeenCalledWith(
        "qr-session:ably-session",
        "authorized",
        expect.objectContaining({
          status: "authorized",
          userId: "user-1",
        })
      );
    });

    it("should return { success: true } on successful authorization", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      mockCreateSession.mockResolvedValue({ token: "auth-token", id: "sess-1" });
      mockPublishToAbly.mockResolvedValue(undefined);

      const result = await controller.authorize({ sessionId: "valid-session" }, mockUser);

      expect(result).toEqual({ success: true });
    });

    it("should still return { success: true } when Ably publish fails", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      mockCreateSession.mockResolvedValue({ token: "auth-token", id: "sess-1" });
      mockPublishToAbly.mockRejectedValue(new Error("Ably unavailable"));

      const result = await controller.authorize({ sessionId: "valid-session" }, mockUser);

      expect(result).toEqual({ success: true });
    });

    it("should update Redis before publishing to Ably", async () => {
      const callOrder: string[] = [];
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      mockCreateSession.mockResolvedValue({ token: "auth-token", id: "sess-1" });
      mockRedis.set.mockImplementation(async () => {
        callOrder.push("redis-set");
        return "OK";
      });
      mockPublishToAbly.mockImplementation(async () => {
        callOrder.push("ably-publish");
      });

      await controller.authorize({ sessionId: "my-session" }, mockUser);

      expect(callOrder[0]).toBe("redis-set");
      expect(callOrder[1]).toBe("ably-publish");
    });

    it("should look up session using correct Redis key", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ status: "pending" }));
      mockCreateSession.mockResolvedValue({ token: "auth-token", id: "sess-1" });
      mockPublishToAbly.mockResolvedValue(undefined);

      await controller.authorize({ sessionId: "my-session-id" }, mockUser);

      expect(mockRedis.get).toHaveBeenCalledWith("qr-session:my-session-id");
    });
  });
});