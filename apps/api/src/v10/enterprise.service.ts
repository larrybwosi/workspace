import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { prisma } from '@repo/database';
import { publishRealtime, AblyChannels } from '@repo/shared/server';

@Injectable()
export class V10EnterpriseService {
  private readonly logger = new Logger(V10EnterpriseService.name);

  async createAnnouncement(bot: any, departmentId: string, data: any) {
    const { title, content, priority = 'normal' } = data;

    if (!title || !content) {
      throw new BadRequestException('Missing title or content');
    }

    // Find department and check if bot is part of the workspace
    /**
     * ⚡ Performance Optimization:
     * 1. Replaces broad `include: { workspace: { include: { members: ... } } }` with a targeted `select` mask.
     *    This avoids fetching full workspace records and heavy user membership columns, reducing DB payload and memory overhead.
     */
    const department = await prisma.workspaceDepartment.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        workspaceId: true,
        workspace: {
          select: {
            members: {
              where: { userId: bot.id },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!department) throw new NotFoundException('Department not found');
    if (!department.workspace?.members || department.workspace.members.length === 0) {
      throw new ForbiddenException('Bot is not a member of this workspace');
    }

    // Create announcement
    const announcement = await prisma.departmentAnnouncement.create({
      data: {
        departmentId,
        authorId: bot.id,
        title,
        content,
        priority,
        targetAudience: { departments: [departmentId] } as any,
      },
    });

    /**
     * ⚡ Performance Optimization:
     * Background non-critical real-time publishing with `.catch()` to prevent network I/O
     * latency from blocking the HTTP announcement creation response path.
     */
    publishRealtime(AblyChannels.workspace(department.workspaceId), 'DEPARTMENT_ANNOUNCEMENT_CREATE', {
      announcement,
    }).catch(err => this.logger.error('Failed to publish department announcement realtime event:', err));

    return announcement;
  }
}
