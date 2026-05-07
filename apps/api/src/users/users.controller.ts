import { Controller, Get, Post, Delete, Param, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile details' })
  async getMe(@CurrentUser() user: User): Promise<any> {
    return prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatar: true,
        banner: true,
        statusText: true,
        statusEmoji: true,
        role: true,
        status: true,
        createdAt: true,
        notificationPreferences: true,
      },
    });
  }

  @Get(':id/social-profile')
  @ApiOperation({ summary: 'Get social profile between current user and target user' })
  @ApiParam({ name: 'id', description: 'The target user ID' })
  @ApiResponse({ status: 200, description: 'Social profile details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getSocialProfile(@CurrentUser() currentUser: User, @Param('id') targetId: string): Promise<any> {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, avatar: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check friendship status
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: currentUser.id, friendId: targetId },
          { userId: targetId, friendId: currentUser.id },
        ],
      },
    });

    // Check for pending friend requests
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: targetId, status: 'pending' },
          { senderId: targetId, receiverId: currentUser.id, status: 'pending' },
        ],
      },
    });

    // Check if blocked
    const blockedByMe = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId: currentUser.id,
          blockedUserId: targetId,
        },
      },
    });

    const blockedMe = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId: targetId,
          blockedUserId: currentUser.id,
        },
      },
    });

    // Find mutual workspaces
    const mutualWorkspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId: currentUser.id },
        },
        AND: {
          members: {
            some: { userId: targetId },
          },
        },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        slug: true,
      },
    });

    // Find mutual friends
    // 1. Get currentUser's friends
    const currentUserFriends = await prisma.friend.findMany({
      where: { userId: currentUser.id },
      select: { friendId: true },
    });
    const currentUserFriendIds = new Set(currentUserFriends.map((f) => f.friendId));

    // 2. Get targetUser's friends
    const targetUserFriends = await prisma.friend.findMany({
      where: { userId: targetId },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
      },
    });

    // 3. Intersect
    const mutualFriends = targetUserFriends
      .filter((f) => currentUserFriendIds.has(f.friendId))
      .map((f) => ({
        id: f.friend.id,
        name: f.friend.name,
        avatar: f.friend.avatar || (f.friend as any).image,
      }));

    return {
      isFriend: !!friendship,
      friendRequestStatus: friendRequest?.status || null,
      friendRequestSide: friendRequest ? (friendRequest.senderId === currentUser.id ? 'sender' : 'receiver') : null,
      isBlockedByMe: !!blockedByMe,
      hasBlockedMe: !!blockedMe,
      mutualWorkspaces: mutualWorkspaces.map((w) => ({
        id: w.id,
        name: w.name,
        icon: w.icon,
        slug: w.slug,
      })),
      mutualFriends,
    };
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block a user' })
  @ApiParam({ name: 'id', description: 'The user ID to block' })
  @ApiResponse({ status: 201, description: 'User blocked successfully' })
  async blockUser(@CurrentUser() currentUser: User, @Param('id') targetId: string): Promise<any> {
    if (currentUser.id === targetId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    return prisma.blockedUser.upsert({
      where: {
        blockerId_blockedUserId: {
          blockerId: currentUser.id,
          blockedUserId: targetId,
        },
      },
      update: {},
      create: {
        blockerId: currentUser.id,
        blockedUserId: targetId,
      },
    });
  }

  @Delete(':id/block')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiParam({ name: 'id', description: 'The user ID to unblock' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  async unblockUser(@CurrentUser() currentUser: User, @Param('id') targetId: string): Promise<any> {
    try {
      await prisma.blockedUser.delete({
        where: {
          blockerId_blockedUserId: {
            blockerId: currentUser.id,
            blockedUserId: targetId,
          },
        },
      });
      return { success: true };
    } catch (error) {
      if ((error as any).code === 'P2025') {
        throw new NotFoundException('Block record not found');
      }
      throw error;
    }
  }
}
