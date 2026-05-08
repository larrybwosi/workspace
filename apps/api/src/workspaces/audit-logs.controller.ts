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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import type { FastifyReply } from 'fastify';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('workspaces/:slug/audit-logs')
@UseGuards(AuthGuard)
export class AuditLogsController {
  @Get()
  @ApiOperation({ summary: 'Get audit logs for a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  async getAuditLogs(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Query('page') pageNum = '1',
    @Query('limit') limitNum = '50',
  ) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup and membership verification into a single database query.
     * 2. Uses 'include' to retrieve the workspace and the current user's membership in one round-trip.
     * 3. Reduces database round-trips from 2 down to 1.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = workspace.members[0];

    if (!member) {
      throw new ForbiddenException('Forbidden');
    }

    const page = parseInt(pageNum);
    const limit = parseInt(limitNum);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      /**
       * ⚡ Optimization: Removes redundant workspace include.
       * All logs in this set belong to the same workspace, which we already have in memory.
       * Reduces database payload size and prevents redundant repeated data retrieval.
       */
      prisma.workspaceAuditLog.findMany({
        where: { workspaceId: workspace.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      workspace: {
        name: workspace.name,
        slug: workspace.slug,
      },
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
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportAuditLogs(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Res() res: FastifyReply,
  ) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup and membership verification into a single database query.
     * 2. Uses 'include' to retrieve the workspace and the current user's membership in one round-trip.
     * 3. Reduces database round-trips from 2 down to 1.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = workspace.members[0];

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

    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      `attachment; filename="audit-logs-${workspace.id}-${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}
