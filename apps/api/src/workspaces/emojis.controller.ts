import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
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
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const emojis = await prisma.customEmoji.findMany({
      where: {
        OR: [{ workspaceId: workspace.id }, { isGlobal: true }],
        isActive: true,
      },
      orderBy: {
        usageCount: 'desc',
      },
    });

    return emojis;
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom emoji' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateEmojiDto })
  @ApiResponse({ status: 201, description: 'Emoji created successfully' })
  async createEmoji(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: CreateEmojiDto,
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
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
