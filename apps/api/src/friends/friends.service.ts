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
            { friend: { name: { contains: search, mode: 'insensitive' } } },
            { friend: { email: { contains: search, mode: 'insensitive' } } },
            { friend: { username: { contains: search, mode: 'insensitive' } } },
            { nickname: { contains: search, mode: 'insensitive' } },
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
        createdAt: 'desc',
      },
    });
  }

  async getFriendRequests(userId: string, type?: string, status?: string) {
    const where: any = {
      ...(status && { status }),
    };

    if (type === 'sent') {
      where.senderId = userId;
    } else if (type === 'received') {
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
        createdAt: 'desc',
      },
    });
  }

  /**
   * ⚡ Performance Optimization:
   * 1. Consolidates 3 database round-trips into 1 using a single 'prisma.user.findFirst' call with nested select.
   * 2. This query simultaneously checks if the user exists, if they are already friends,
   *    and if there's a pending friend request in either direction.
   * 3. Uses Promise.all for concurrent delivery of database and real-time notifications.
   * Expected impact: Reduces database round-trips by 66% for the validation phase.
   */
  async sendFriendRequest(senderId: string, senderName: string, receiverEmailOrUsername: string, message?: string) {
    const receiver = await prisma.user.findFirst({
      where: {
        OR: [{ email: receiverEmailOrUsername }, { username: receiverEmailOrUsername }],
      },
      select: {
        id: true,
        // Check for existing friendship (in either direction)
        friendOf: {
          where: { userId: senderId },
          select: { id: true },
          take: 1,
        },
        friends: {
          where: { friendId: senderId },
          select: { id: true },
          take: 1,
        },
        // Check for existing pending request (in either direction)
        receivedFriendRequests: {
          where: { senderId: senderId, status: 'pending' },
          select: { id: true },
          take: 1,
        },
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

    const isAlreadyFriend = receiver.friendOf.length > 0 || receiver.friends.length > 0;
    if (isAlreadyFriend) {
      throw new BadRequestException('Already friends with this user');
    }

    const hasPendingRequest = receiver.receivedFriendRequests.length > 0 || receiver.sentFriendRequests.length > 0;
    if (hasPendingRequest) {
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

    // ⚡ Optimization: Deliver notifications concurrently
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'friend_request',
          title: 'New Friend Request',
          message: `${senderName} sent you a friend request`,
          entityType: 'friend_request',
          entityId: friendRequest.id,
          linkUrl: `/friends/requests`,
          metadata: {
            senderId,
            senderName,
            message,
          },
        },
      }),
      publishToAbly(`user:${receiverId}`, 'NOTIFICATION', {
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${senderName} sent you a friend request`,
        entityType: 'friend_request',
        entityId: friendRequest.id,
        linkUrl: `/friends/requests`,
      }),
    ]);

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

    if (action === 'cancel' && friendRequest.senderId !== userId) {
      throw new ForbiddenException('Only sender can cancel the request');
    }

    if ((action === 'accept' || action === 'decline') && friendRequest.receiverId !== userId) {
      throw new ForbiddenException('Only receiver can accept or decline the request');
    }

    if (friendRequest.status !== 'pending') {
      throw new BadRequestException('Request has already been processed');
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'cancelled',
        respondedAt: action !== 'cancel' ? new Date() : undefined,
      },
    });

    if (action === 'accept') {
      /**
       * ⚡ Performance Optimization:
       * Replaces transaction with multiple 'create' calls with a single 'createMany'.
       * This reduces database round-trips and leverages bulk insertion.
       */
      await prisma.friend.createMany({
        data: [
          {
            userId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          },
          {
            userId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          },
        ],
        skipDuplicates: true,
      });

      // ⚡ Optimization: Deliver notifications concurrently
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: friendRequest.senderId,
            type: 'friend_request_accepted',
            title: 'Friend Request Accepted',
            message: `${friendRequest.receiver.name} accepted your friend request`,
            entityType: 'friend',
            entityId: friendRequest.receiverId,
            linkUrl: `/friends`,
          },
        }),
        publishToAbly(`user:${friendRequest.senderId}`, 'NOTIFICATION', {
          type: 'friend_request_accepted',
          title: 'Friend Request Accepted',
          message: `${friendRequest.receiver.name} accepted your friend request`,
          entityType: 'friend',
          entityId: friendRequest.receiverId,
          linkUrl: `/friends`,
        }),
      ]);
    } else if (action === 'decline') {
      // ⚡ Optimization: Deliver notifications concurrently
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: friendRequest.senderId,
            type: 'friend_request_declined',
            title: 'Friend Request Declined',
            message: `${friendRequest.receiver.name} declined your friend request`,
            entityType: 'friend_request',
            entityId: requestId,
          },
        }),
        publishToAbly(`user:${friendRequest.senderId}`, 'NOTIFICATION', {
          type: 'friend_request_declined',
          title: 'Friend Request Declined',
          message: `${friendRequest.receiver.name} declined your friend request`,
        }),
      ]);
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
