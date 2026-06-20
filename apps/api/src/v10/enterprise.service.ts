import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { publishRealtime, AblyChannels } from '@repo/shared/server';

@Injectable()
export class V10EnterpriseService {
  async createAnnouncement(userId: string, departmentId: string, body: any) {
    const department = await prisma.workspaceDepartment.findUnique({
      where: { id: departmentId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const member = department.members[0];
    if (!member || !['admin', 'owner'].includes(member.role)) {
      throw new ForbiddenException('Only department admins can create announcements');
    }

    const announcement = await prisma.departmentAnnouncement.create({
      data: {
        departmentId,
        title: body.title,
        content: body.content,
        createdById: userId,
      },
    });

    // Notify clients via Realtime
    await publishRealtime(AblyChannels.workspace(department.workspaceId), 'DEPARTMENT_ANNOUNCEMENT_CREATE', {
      announcement,
      departmentId,
    });

    return announcement;
  }
}
