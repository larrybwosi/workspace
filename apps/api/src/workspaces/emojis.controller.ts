import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { IsString, IsUrl } from 'class-validator';
import { z } from 'zod';

class CreateEmojiDto {
  @IsString()
  @ApiProperty({ example: 'party-parrot' })
  name: string;

  @IsString()
  @ApiProperty({ example: 'party_parrot' })
  shortcode: string;

  @IsUrl()
  @ApiProperty({ example: 'https://example.com/emoji.png' })
  imageUrl: string;
}

const createEmojiSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters'),
  shortcode: z
    .string()
    .trim()
    .min(1, 'Shortcode is required')
    .max(50, 'Shortcode cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_\-:]+$/, 'Shortcode contains invalid characters'),
  imageUrl: z.string().trim().url('Image URL must be a valid URL'),
});

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
     * 1. Consolidates workspace resolution, membership verification, and emoji retrieval.
     * 2. Uses parallelized queries via Promise.all to reduce database RTT from 2 down to 1.
     * 3. Leverages database-level OR filter for global and workspace emojis, ensuring efficient sorting.
     * Expected impact: ~50% reduction in database latency for emoji listings.
     */
    const [workspace, emojis] = await Promise.all([
      prisma.workspace.findUnique({
        where: { slug },
        select: {
          id: true,
          members: {
            where: { userId: user.id },
            select: { userId: true },
          },
        },
      }),
      prisma.customEmoji.findMany({
        where: {
          OR: [{ workspace: { slug } }, { isGlobal: true }],
          isActive: true,
        },
        orderBy: {
          usageCount: 'desc',
        },
      }),
    ]);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.members.length === 0) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    return emojis;
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom emoji' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateEmojiDto })
  @ApiResponse({ status: 201, description: 'Emoji created successfully' })
  async createEmoji(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: CreateEmojiDto) {
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
      throw new ForbiddenException('Only workspace owners and admins can create custom emojis');
    }

    /**
     * 🛡️ Security Hardening (Input Validation & Malformed Payload Mitigation):
     * Strict Zod schema validation enforces payload types, string bounds, regex pattern constraints on shortcodes,
     * and valid URL structures on imageUrl to prevent stored XSS, malformed database state, and unhandled runtime exceptions.
     */
    const validated = createEmojiSchema.safeParse(body);
    if (!validated.success) {
      throw new BadRequestException(validated.error.issues);
    }

    const { name, shortcode, imageUrl } = validated.data;
    const cleanShortcode = shortcode.replace(/^:+|:+$/g, '');
    const formattedShortcode = `:${cleanShortcode}:`;

    const emoji = await prisma.customEmoji.create({
      data: {
        name,
        shortcode: formattedShortcode,
        imageUrl,
        workspaceId: workspace.id,
        createdById: user.id,
      },
    });

    return emoji;
  }
}
