import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { publishToAbly, AblyChannels } from '@repo/shared';

@Injectable()
export class V10EnterpriseService {
  async createAnnouncement(bot: any, departmentId: string, data: any) {
    const { title, content, priority = 'normal' } = data;

    if (!title || !content) {
      throw new BadRequestException('Missing title or content');
    }

    // Find department and check if bot is part of the workspace
    const department = await prisma.workspaceDepartment.findUnique({
      where: { id: departmentId },
      include: { workspace: { include: { members: { where: { userId: bot.id } } } } },
    });

    if (!department) throw new NotFoundException('Department not found');
    if (department.workspace.members.length === 0) {
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

    // Notify clients via Ably
    await publishToAbly(AblyChannels.workspace(department.workspaceId), 'DEPARTMENT_ANNOUNCEMENT_CREATE', {
      announcement,
    });

    return announcement;
  }
}
