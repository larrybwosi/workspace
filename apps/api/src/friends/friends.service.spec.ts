import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { FriendsService } from "./friends.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

// Mock @repo/database
vi.mock("@repo/database", () => ({
  prisma: {
    friend: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    friendRequest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock @repo/shared/server
vi.mock("@repo/shared/server", () => ({
  publishToAbly: vi.fn().mockResolvedValue(undefined),
  AblyEvents: {
    NOTIFICATION: "NOTIFICATION",
  },
  AblyChannels: {
    user: vi.fn((id: string) => `user:${id}`),
  },
}));

import { prisma } from "@repo/database";

describe("FriendsService", () => {
  let service: FriendsService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FriendsService],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getFriends - username search (PR change)", () => {
    it("should include username in the search filter when search is provided", async () => {
      mockPrisma.friend.findMany.mockResolvedValue([]);

      await service.getFriends("user-1", "alice");

      expect(mockPrisma.friend.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { friend: { username: { contains: "alice", mode: "insensitive" } } },
            ]),
          }),
        })
      );
    });

    it("should NOT include username in the search filter when no search provided", async () => {
      mockPrisma.friend.findMany.mockResolvedValue([]);

      await service.getFriends("user-1");

      // When no search, there should be no OR filter
      const callArg = mockPrisma.friend.findMany.mock.calls[0][0];
      expect(callArg.where).not.toHaveProperty("OR");
    });

    it("should include name, email, username, and nickname in OR filter", async () => {
      mockPrisma.friend.findMany.mockResolvedValue([]);

      await service.getFriends("user-1", "test");

      const callArg = mockPrisma.friend.findMany.mock.calls[0][0];
      const orFilter = callArg.where.OR;
      const filterKeys = orFilter.map((f: any) =>
        f.friend ? Object.keys(f.friend)[0] : Object.keys(f)[0]
      );
      expect(filterKeys).toContain("name");
      expect(filterKeys).toContain("email");
      expect(filterKeys).toContain("username");
      expect(filterKeys).toContain("nickname");
    });
  });

  describe("sendFriendRequest - accepts email OR username (PR change)", () => {
    it("should find receiver by email", async () => {
      const receiver = { id: "user-2", name: "Bob" };
      mockPrisma.user.findFirst.mockResolvedValue(receiver);
      mockPrisma.friend.findFirst.mockResolvedValue(null);
      mockPrisma.friendRequest.findFirst.mockResolvedValue(null);
      mockPrisma.friendRequest.create.mockResolvedValue({
        id: "req-1",
        senderId: "user-1",
        receiverId: "user-2",
        sender: { id: "user-1" },
        receiver: receiver,
      });
      mockPrisma.notification.create.mockResolvedValue({});

      await service.sendFriendRequest("user-1", "Alice", "bob@example.com");

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: "bob@example.com" },
              { username: "bob@example.com" },
            ],
          },
        })
      );
    });

    it("should find receiver by username (PR change: username lookup support)", async () => {
      const receiver = { id: "user-2", name: "Bob" };
      mockPrisma.user.findFirst.mockResolvedValue(receiver);
      mockPrisma.friend.findFirst.mockResolvedValue(null);
      mockPrisma.friendRequest.findFirst.mockResolvedValue(null);
      mockPrisma.friendRequest.create.mockResolvedValue({
        id: "req-1",
        senderId: "user-1",
        receiverId: "user-2",
        sender: { id: "user-1" },
        receiver: receiver,
      });
      mockPrisma.notification.create.mockResolvedValue({});

      await service.sendFriendRequest("user-1", "Alice", "bob_username");

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: "bob_username" },
              { username: "bob_username" },
            ],
          },
        })
      );
    });

    it("should throw NotFoundException when receiver not found by email or username", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.sendFriendRequest("user-1", "Alice", "nonexistent@example.com")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when sender tries to send request to themselves", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1", name: "Self" });

      await expect(
        service.sendFriendRequest("user-1", "Alice", "self@example.com")
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.sendFriendRequest("user-1", "Alice", "self@example.com")
      ).rejects.toThrow("Cannot send friend request to yourself");
    });

    it("should throw BadRequestException when already friends", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-2", name: "Bob" });
      mockPrisma.friend.findFirst.mockResolvedValue({ id: "friendship-1" });

      await expect(
        service.sendFriendRequest("user-1", "Alice", "bob@example.com")
      ).rejects.toThrow("Already friends with this user");
    });

    it("should throw BadRequestException when pending request already exists", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-2", name: "Bob" });
      mockPrisma.friend.findFirst.mockResolvedValue(null);
      mockPrisma.friendRequest.findFirst.mockResolvedValue({ id: "req-1", status: "pending" });

      await expect(
        service.sendFriendRequest("user-1", "Alice", "bob@example.com")
      ).rejects.toThrow("Friend request already pending");
    });

    it("should successfully create friend request and notification", async () => {
      const receiver = { id: "user-2", name: "Bob" };
      const createdRequest = {
        id: "req-1",
        senderId: "user-1",
        receiverId: "user-2",
        sender: { id: "user-1", name: "Alice" },
        receiver,
      };

      mockPrisma.user.findFirst.mockResolvedValue(receiver);
      mockPrisma.friend.findFirst.mockResolvedValue(null);
      mockPrisma.friendRequest.findFirst.mockResolvedValue(null);
      mockPrisma.friendRequest.create.mockResolvedValue(createdRequest);
      mockPrisma.notification.create.mockResolvedValue({ id: "notif-1" });

      const result = await service.sendFriendRequest(
        "user-1",
        "Alice",
        "bob@example.com",
        "Hey Bob!"
      );

      expect(result).toEqual(createdRequest);
      expect(mockPrisma.friendRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            senderId: "user-1",
            receiverId: "user-2",
            message: "Hey Bob!",
          }),
        })
      );
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-2",
            type: "friend_request",
          }),
        })
      );
    });
  });
});