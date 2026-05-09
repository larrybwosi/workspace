import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class WorkspaceAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    const workspaceId = request.query.workspaceId || request.body.workspaceId || request.params.workspaceId;

    if (!workspaceId) {
      return true; // If no workspaceId is provided, we can't check, let the controller handle it or fail
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!member || !['owner', 'admin', 'moderator'].includes(member.role)) {
      throw new ForbiddenException('You do not have administrative permissions in this workspace');
    }

    return true;
  }
}
