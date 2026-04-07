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
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';

@Controller('workspaces/:slug/emojis')
@UseGuards(AuthGuard)
export class EmojisController {
  @Get()
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
  async createEmoji(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: any,
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
