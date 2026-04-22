import { Test, TestingModule } from "@nestjs/testing";
import { AblyController } from "./ably.controller";
import { AuthGuard } from "../../auth/auth.guard";
import { ConfigService } from "@nestjs/config";

describe("AblyController", () => {
  let controller: AblyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AblyController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue("mock_key"),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AblyController>(AblyController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getToken", () => {
    it("should generate a token request with granular capabilities", async () => {
      const mockUser = { id: "user_123" } as any;

      // Mock getAblyRest
      const mockCreateTokenRequest = vi.fn().mockResolvedValue({ keyName: "mock.key" });
      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue({
        auth: {
          createTokenRequest: mockCreateTokenRequest,
        },
      } as any);

      await controller.getToken(mockUser);

      expect(mockCreateTokenRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: "user_123",
          capability: expect.objectContaining({
            "user:user_123": ["subscribe", "publish", "history", "presence"],
            "user:user_123:*": ["subscribe", "publish", "history", "presence"],
            "notifications:user_123": ["subscribe", "publish", "history", "presence"],
            "notifications:user_123:*": ["subscribe", "publish", "history", "presence"],
            "channel:*": ["subscribe", "publish", "history", "presence"],
          }),
        })
      );
    });

    it("should include new call:* capability (PR change)", async () => {
      const mockUser = { id: "user_456" } as any;

      const mockCreateTokenRequest = vi.fn().mockResolvedValue({ keyName: "mock.key" });
      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue({
        auth: {
          createTokenRequest: mockCreateTokenRequest,
        },
      } as any);

      await controller.getToken(mockUser);

      const callArg = mockCreateTokenRequest.mock.calls[0][0];
      expect(callArg.capability["call:*"]).toEqual([
        "subscribe",
        "publish",
        "history",
        "presence",
      ]);
    });

    it("should include new global-presence capability (PR change)", async () => {
      const mockUser = { id: "user_789" } as any;

      const mockCreateTokenRequest = vi.fn().mockResolvedValue({ keyName: "mock.key" });
      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue({
        auth: {
          createTokenRequest: mockCreateTokenRequest,
        },
      } as any);

      await controller.getToken(mockUser);

      const callArg = mockCreateTokenRequest.mock.calls[0][0];
      expect(callArg.capability["global-presence"]).toEqual([
        "subscribe",
        "publish",
        "history",
        "presence",
      ]);
    });

    it("should include user:${id} capability (PR change: without wildcard)", async () => {
      const mockUser = { id: "user_direct" } as any;

      const mockCreateTokenRequest = vi.fn().mockResolvedValue({ keyName: "mock.key" });
      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue({
        auth: { createTokenRequest: mockCreateTokenRequest },
      } as any);

      await controller.getToken(mockUser);

      const callArg = mockCreateTokenRequest.mock.calls[0][0];
      expect(callArg.capability["user:user_direct"]).toEqual([
        "subscribe",
        "publish",
        "history",
        "presence",
      ]);
    });

    it("should include notifications:${id} capability (PR change: without wildcard)", async () => {
      const mockUser = { id: "user_notif" } as any;

      const mockCreateTokenRequest = vi.fn().mockResolvedValue({ keyName: "mock.key" });
      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue({
        auth: { createTokenRequest: mockCreateTokenRequest },
      } as any);

      await controller.getToken(mockUser);

      const callArg = mockCreateTokenRequest.mock.calls[0][0];
      expect(callArg.capability["notifications:user_notif"]).toEqual([
        "subscribe",
        "publish",
        "history",
        "presence",
      ]);
    });

    it("should set TTL to 1 hour (3600000 ms)", async () => {
      const mockUser = { id: "user_ttl" } as any;

      const mockCreateTokenRequest = vi.fn().mockResolvedValue({ keyName: "mock.key" });
      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue({
        auth: {
          createTokenRequest: mockCreateTokenRequest,
        },
      } as any);

      await controller.getToken(mockUser);

      const callArg = mockCreateTokenRequest.mock.calls[0][0];
      expect(callArg.ttl).toBe(3600 * 1000);
    });

    it("should throw an error when Ably client is not initialized", async () => {
      const mockUser = { id: "user_no_ably" } as any;

      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue(null as any);

      await expect(controller.getToken(mockUser)).rejects.toThrow(
        "Ably client not initialized"
      );
    });

    it("should set clientId to the user's id", async () => {
      const mockUser = { id: "specific_user_id" } as any;

      const mockCreateTokenRequest = vi.fn().mockResolvedValue({ keyName: "mock.key" });
      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue({
        auth: {
          createTokenRequest: mockCreateTokenRequest,
        },
      } as any);

      await controller.getToken(mockUser);

      const callArg = mockCreateTokenRequest.mock.calls[0][0];
      expect(callArg.clientId).toBe("specific_user_id");
    });

    it("should include timestamp in the token request", async () => {
      const mockUser = { id: "user_ts" } as any;

      const mockCreateTokenRequest = vi.fn().mockResolvedValue({ keyName: "mock.key" });
      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue({
        auth: { createTokenRequest: mockCreateTokenRequest },
      } as any);

      const before = Date.now();
      await controller.getToken(mockUser);
      const after = Date.now();

      const callArg = mockCreateTokenRequest.mock.calls[0][0];
      expect(callArg.timestamp).toBeGreaterThanOrEqual(before);
      expect(callArg.timestamp).toBeLessThanOrEqual(after);
    });

    it("should return the token request result", async () => {
      const mockUser = { id: "user_return" } as any;
      const mockTokenResult = { keyName: "mock.key", token: "abc123" };

      const mockCreateTokenRequest = vi.fn().mockResolvedValue(mockTokenResult);
      const shared = await import("@repo/shared/server");
      vi.spyOn(shared, "getAblyRest").mockReturnValue({
        auth: { createTokenRequest: mockCreateTokenRequest },
      } as any);

      const result = await controller.getToken(mockUser);
      expect(result).toEqual(mockTokenResult);
    });
  });
});