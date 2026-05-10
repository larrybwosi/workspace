import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { publishToAbly, AblyEvents, AblyChannels } from '@repo/shared/server';

@Injectable()
export class FriendsService {
  async getFriends(userId: string, search?: string) {
    return prisma.friend.findMany({
      where: {
        userId: userId,
        ...(search && {
          OR: [
            { friend: { name: { contains: search, mode: "insensitive" } } },
            { friend: { email: { contains: search, mode: "insensitive" } } },
            { friend: { username: { contains: search, mode: "insensitive" } } },
            { nickname: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
            status: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getFriendRequests(userId: string, type?: string, status?: string) {
    const where: any = {
      ...(status && { status }),
    };

    if (type === "sent") {
      where.senderId = userId;
    } else if (type === "received") {
      where.receiverId = userId;
    } else {
      where.OR = [{ senderId: userId }, { receiverId: userId }];
    }

    return prisma.friendRequest.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
            status: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
            status: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async sendFriendRequest(senderId: string, senderName: string, receiverEmailOrUsername: string, message?: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates 3 separate database queries into a single 'prisma.user.findFirst' call.
     * 2. Uses nested 'select' and 'where' filters to check for existing friendship and
     *    pending requests in one database round-trip.
     * Expected impact: Reduces database RTT from 3 down to 1 during the verification phase.
     */
    const receiver = await prisma.user.findFirst({
      where: {
        OR: [
          { email: receiverEmailOrUsername },
          { username: receiverEmailOrUsername },
        ],
      },
      select: {
        id: true,
        // Check if sender is already a friend of receiver
        friendOf: {
          where: { userId: senderId },
          select: { id: true },
          take: 1,
        },
        // Check if receiver is already a friend of sender (redundant but safe)
        friends: {
          where: { friendId: senderId },
          select: { id: true },
          take: 1,
        },
        // Check if there is a pending request from sender to receiver
        receivedFriendRequests: {
          where: { senderId, status: 'pending' },
          select: { id: true },
          take: 1,
        },
        // Check if there is a pending request from receiver to sender
        sentFriendRequests: {
          where: { receiverId: senderId, status: 'pending' },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    const receiverId = receiver.id;

    if (receiverId === senderId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    if (receiver.friendOf.length > 0 || receiver.friends.length > 0) {
      throw new BadRequestException('Already friends with this user');
    }

    if (receiver.receivedFriendRequests.length > 0 || receiver.sentFriendRequests.length > 0) {
      throw new BadRequestException('Friend request already pending');
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        message,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, avatar: true, image: true, status: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, avatar: true, image: true, status: true, role: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "friend_request",
        title: "New Friend Request",
        message: `${senderName} sent you a friend request`,
        entityType: "friend_request",
        entityId: friendRequest.id,
        linkUrl: `/friends/requests`,
        metadata: {
          senderId,
          senderName,
          message,
        },
      },
    });

    await publishToAbly(`user:${receiverId}`, "NOTIFICATION", {
      type: "friend_request",
      title: "New Friend Request",
      message: `${senderName} sent you a friend request`,
      entityType: "friend_request",
      entityId: friendRequest.id,
      linkUrl: `/friends/requests`,
    });

    return friendRequest;
  }

  async updateFriendRequest(userId: string, requestId: string, action: 'accept' | 'decline' | 'cancel') {
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (action === "cancel" && friendRequest.senderId !== userId) {
      throw new ForbiddenException('Only sender can cancel the request');
    }

    if ((action === "accept" || action === "decline") && friendRequest.receiverId !== userId) {
      throw new ForbiddenException('Only receiver can accept or decline the request');
    }

    if (friendRequest.status !== "pending") {
      throw new BadRequestException('Request has already been processed');
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: action === "accept" ? "accepted" : action === "decline" ? "declined" : "cancelled",
        respondedAt: action !== "cancel" ? new Date() : undefined,
      },
    });

    if (action === "accept") {
      await prisma.$transaction([
        prisma.friend.create({
          data: {
            userId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          },
        }),
        prisma.friend.create({
          data: {
            userId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          },
        }),
      ]);

      await prisma.notification.create({
        data: {
          userId: friendRequest.senderId,
          type: "friend_request_accepted",
          title: "Friend Request Accepted",
          message: `${friendRequest.receiver.name} accepted your friend request`,
          entityType: "friend",
          entityId: friendRequest.receiverId,
          linkUrl: `/friends`,
        },
      });

      await publishToAbly(`user:${friendRequest.senderId}`, "NOTIFICATION", {
        type: "friend_request_accepted",
        title: "Friend Request Accepted",
        message: `${friendRequest.receiver.name} accepted your friend request`,
        entityType: "friend",
        entityId: friendRequest.receiverId,
        linkUrl: `/friends`,
      });
    } else if (action === "decline") {
      await prisma.notification.create({
        data: {
          userId: friendRequest.senderId,
          type: "friend_request_declined",
          title: "Friend Request Declined",
          message: `${friendRequest.receiver.name} declined your friend request`,
          entityType: "friend_request",
          entityId: requestId,
        },
      });

      await publishToAbly(`user:${friendRequest.senderId}`, "NOTIFICATION", {
        type: "friend_request_declined",
        title: "Friend Request Declined",
        message: `${friendRequest.receiver.name} declined your friend request`,
      });
    }

    return updatedRequest;
  }

  async deleteFriendRequest(userId: string, requestId: string) {
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendRequest.senderId !== userId && friendRequest.receiverId !== userId) {
      throw new ForbiddenException('Unauthorized to delete this request');
    }

    await prisma.friendRequest.delete({
      where: { id: requestId },
    });

    return { success: true };
  }
}
