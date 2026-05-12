import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';

class CreateEmojiDto {
  @ApiProperty({ example: 'party-parrot' })
  name: string;

  @ApiProperty({ example: 'party_parrot' })
  shortcode: string;

  @ApiProperty({ example: 'https://example.com/emoji.png' })
  imageUrl: string;
}

@ApiTags('Emojis')
@ApiBearerAuth()
@Controller('workspaces/:slug/emojis')
@UseGuards(AuthGuard)
export class EmojisController {
  @Get()
  @ApiOperation({ summary: 'Get all custom emojis for a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of custom emojis' })
  async getEmojis(@CurrentUser() user: User, @Param('slug') slug: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup, membership verification, and custom emoji retrieval into a single database query.
     * 2. Reduces database round-trips from 2 down to 1.
     * 3. Adds authorization: ensures the user is a member of the workspace before returning custom emojis.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
        customEmojis: {
          where: {
            isActive: true,
          },
          orderBy: {
            usageCount: 'desc',
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Forbidden');
    }

    // Fetch global emojis separately since they are not workspace-specific
    const globalEmojis = await prisma.customEmoji.findMany({
      where: {
        isGlobal: true,
        isActive: true,
      },
      orderBy: {
        usageCount: 'desc',
      },
    });

    // Merge workspace-specific and global emojis
    return [...workspace.customEmojis, ...globalEmojis];
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom emoji' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateEmojiDto })
  @ApiResponse({ status: 201, description: 'Emoji created successfully' })
  async createEmoji(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: CreateEmojiDto) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup and membership verification into a single database query.
     * 2. Reduces database round-trips from 2 down to 1.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = workspace.members[0];

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const { name, shortcode, imageUrl } = body;

    if (!name || !shortcode || !imageUrl) {
      throw new BadRequestException('Missing required fields');
    }

    const emoji = await prisma.customEmoji.create({
      data: {
        name,
        shortcode: shortcode.startsWith(':') ? shortcode : `:${shortcode}:`,
        imageUrl,
        workspaceId: workspace.id,
        createdById: user.id,
      },
    });

    return emoji;
  }
}
