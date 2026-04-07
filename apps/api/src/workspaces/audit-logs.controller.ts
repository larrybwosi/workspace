import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import type { Response } from 'express';

@Controller('workspaces/:slug/audit-logs')
@UseGuards(AuthGuard)
export class AuditLogsController {
  @Get()
  async getAuditLogs(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Query('page') pageNum = '1',
    @Query('limit') limitNum = '50',
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const page = parseInt(pageNum);
    const limit = parseInt(limitNum);
    const skip = (page - 1) * limit;

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Forbidden');
    }

    const [logs, total] = await Promise.all([
      prisma.workspaceAuditLog.findMany({
        where: { workspaceId: workspace.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.workspaceAuditLog.count({
        where: { workspaceId: workspace.id },
      }),
    ]);

    const userIds = [...new Set(logs.map((log) => log.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const userMap = users.reduce(
      (acc, u) => {
        acc[u.id] = u;
        return acc;
      },
      {} as Record<string, (typeof users)[0]>,
    );

    const enrichedLogs = logs.map((log) => ({
      ...log,
      user: userMap[log.userId] || null,
    }));

    return {
      logs: enrichedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('export')
  async exportAuditLogs(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden - Admin access required');
    }

    const logs = await prisma.workspaceAuditLog.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const userIds = [...new Set(logs.map((log) => log.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = users.reduce(
      (acc, u) => {
        acc[u.id] = u;
        return acc;
      },
      {} as Record<string, (typeof users)[0]>,
    );

    const csvHeader = 'Timestamp,Action,Actor Name,Actor Email,Resource,Resource ID,Metadata\n';
    const csvRows = logs
      .map((log) => {
        const u = userMap[log.userId];
        return [
          new Date(log.createdAt).toISOString(),
          log.action,
          u?.name || 'Unknown',
          u?.email || 'N/A',
          log.resource,
          log.resourceId || 'N/A',
          JSON.stringify(log.metadata || {}),
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',');
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-logs-${workspace.id}-${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}
