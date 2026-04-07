import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import { ApiV2Context } from '../auth/api-v2.guard';

@Injectable()
export class V2AuditService {
  async log(
    context: ApiV2Context,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: any,
  ) {
    if (!context.workspaceId) return;

    try {
      await prisma.workspaceAuditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.userId,
          action: `v2.${action}`,
          resource,
          resourceId,
          metadata: {
            ...metadata,
            isBot: context.isBot,
            tokenId: context.tokenId,
            clientId: context.clientId,
          },
        },
      });
    } catch (error) {
      console.error('V2 Audit Log Error:', error);
    }
  }
}
