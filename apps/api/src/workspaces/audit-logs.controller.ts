import { Controller, Get, Param, Query, UseGuards, NotFoundException, ForbiddenException, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
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
    @Query('limit') limitNum = '50'
  ) {
    const page = parseInt(pageNum);
    const limit = parseInt(limitNum);
    const skip = (page - 1) * limit;

    /**
     * ⚡ Performance Optimization:
     * Consolidates workspace lookup, membership verification, audit log retrieval,
     * and total count into a single database query.
     * Reduces database round-trips from 3 down to 1.
     * Expected impact: Faster response times and significantly reduced DB load.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
        auditLogs: {
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userId: true,
            action: true,
            resource: true,
            resourceId: true,
            metadata: true,
            createdAt: true,
          },
        },
        _count: {
          select: { auditLogs: true },
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

    // Attach workspace metadata to logs to maintain API compatibility
    const logs = workspace.auditLogs.map(log => ({
      ...log,
      workspace: {
        name: workspace.name,
        slug: workspace.slug,
      },
    }));
    const total = workspace._count.auditLogs;

    /**
     * ⚡ Performance Optimization:
     * Short-circuits secondary user lookups if userIds is empty to prevent redundant DB round-trips.
     * Uses O(1) Map lookups instead of object reduction.
     */
    const userIds = [...new Set(logs.map(log => log.userId))];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          })
        : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      workspace: {
        name: workspace.name,
        slug: workspace.slug,
      },
      user: userMap.get(log.userId) || null,
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
  async exportAuditLogs(@CurrentUser() user: User, @Param('slug') slug: string, @Res() res: FastifyReply) {
    /**
     * ⚡ Performance Optimization:
     * Consolidates workspace lookup, membership verification, and audit log retrieval
     * into a single database query.
     * Reduces database round-trips from 3 down to 1.
     * Expected impact: Faster export initialization and reduced database load.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10000,
          select: {
            id: true,
            userId: true,
            action: true,
            resource: true,
            resourceId: true,
            metadata: true,
            createdAt: true,
          },
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

    const logs = workspace.auditLogs;

    /**
     * ⚡ Performance Optimization:
     * Short-circuits secondary user lookups if userIds is empty.
     * Uses O(1) Map lookups.
     */
    const userIds = [...new Set(logs.map(log => log.userId))];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
          })
        : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    const csvHeader = 'Timestamp,Action,Actor Name,Actor Email,Resource,Resource ID,Metadata\n';
    const csvRows = logs
      .map(log => {
        const u = userMap.get(log.userId);
        return [
          new Date(log.createdAt).toISOString(),
          log.action,
          u?.name || 'Unknown',
          u?.email || 'N/A',
          log.resource,
          log.resourceId || 'N/A',
          JSON.stringify(log.metadata || {}),
        ]
          .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',');
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="audit-logs-${workspace.id}-${Date.now()}.csv"`);
    res.send(csv);
  }
}
