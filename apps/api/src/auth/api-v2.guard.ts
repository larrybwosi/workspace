import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { prisma } from '@repo/database';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import { auth } from './better-auth';

export interface ApiV2Context {
  userId: string;
  clientId: string;
  scopes: string[];
  workspaceId?: string;
  workspaceSlug?: string;
  isBot?: boolean;
  tokenId?: string;
}

@Injectable()
export class ApiV2Guard implements CanActivate {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext.switchToHttp().getRequest();
    const slug = request.params.slug;

    const authHeader = request.headers.authorization;
    let context: ApiV2Context | undefined;
    let rateLimit = 100;
    let rateLimitKey = '';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback to Session-based auth
      const session = await auth.api.getSession({
        headers: request.headers,
      }).catch(() => null);

      if (!session?.user) {
        throw new UnauthorizedException('Unauthorized');
      }

      context = {
        userId: session.user.id,
        clientId: `session:${session.user.id}`,
        scopes: ['*'],
      };

      let workspaceId = session.session.activeOrganizationId;
      let workspaceSlug = '';

      if (slug) {
        const organization = await auth.api.getFullOrganization({
          headers: request.headers,
          query: { organizationSlug: slug }
        }).catch(() => null);

        if (!organization) {
          throw new NotFoundException('Workspace not found');
        }

        workspaceId = organization.id;
        workspaceSlug = organization.slug;
      }

      if (workspaceId) {
        const members = await auth.api.listMembers({
          headers: request.headers,
          query: { organizationId: workspaceId }
        }).catch(() => []);

        const membersList = Array.isArray(members) ? members : (members as any).members || [];
        const isMember = membersList.some((m: any) => m.userId === session.user.id);

        if (!isMember) {
          throw new ForbiddenException('Forbidden: Not a member of this workspace');
        }

        context.workspaceId = workspaceId;
        context.workspaceSlug = workspaceSlug;
      }

      rateLimit = 1000;
      rateLimitKey = `ratelimit:v2:session:${session.user.id}`;
    } else {
      const accessToken = authHeader.substring(7);
      if (accessToken.startsWith('wst_')) {
        const hashedToken = crypto.createHash('sha256').update(accessToken).digest('hex');
        const apiToken = await prisma.workspaceApiToken.findUnique({
          where: { token: hashedToken },
          include: { workspace: true },
        });

        if (!apiToken || (apiToken.expiresAt && apiToken.expiresAt < new Date())) {
          throw new UnauthorizedException('Invalid or expired API token');
        }

        const permissions = (apiToken.permissions as any)?.actions || [];
        const scopes = permissions.map((p: string) => {
          const [action, resource] = p.split(':');
          return `${resource}:${action === 'send' ? 'send' : action}`;
        });

        context = {
          userId: apiToken.createdById,
          clientId: apiToken.id,
          scopes: scopes,
          workspaceId: apiToken.workspaceId,
          workspaceSlug: apiToken.workspace.slug,
          isBot: true,
          tokenId: apiToken.id,
        };

        if (slug && slug !== apiToken.workspace.slug) {
          throw new ForbiddenException('Token does not belong to this workspace');
        }

        rateLimit = apiToken.rateLimit;
        rateLimitKey = `ratelimit:v2:token:${apiToken.id}`;

        await prisma.workspaceApiToken.update({
          where: { id: apiToken.id },
          data: {
            lastUsedAt: new Date(),
            usageCount: { increment: 1 },
          },
        });
      } else {
        const tokenInfo = await (auth.api as any).getOAuthAccessToken({
          headers: request.headers,
          query: { token: accessToken },
        }).catch(() => null);

        if (!tokenInfo || new Date(tokenInfo.expiresAt) < new Date()) {
          throw new UnauthorizedException('Invalid or expired token');
        }

        context = {
          userId: tokenInfo.userId,
          clientId: tokenInfo.clientId,
          scopes: tokenInfo.scopes,
        };

        if (slug) {
          const organization = await auth.api.getFullOrganization({
            headers: request.headers,
            query: { organizationSlug: slug },
          }).catch(() => null);

          if (!organization) {
            throw new NotFoundException('Workspace not found');
          }

          const members = await auth.api.listMembers({
            headers: request.headers,
            query: { organizationId: organization.id },
          }).catch(() => []);

          const membersList = Array.isArray(members) ? members : (members as any).members || [];
          const isMember = membersList.some((m: any) => m.userId === tokenInfo.userId);

          if (!isMember) {
            throw new ForbiddenException('Forbidden: Not a member of this workspace');
          }

          context.workspaceId = organization.id;
          context.workspaceSlug = organization.slug;
        }

        rateLimit = 100;
        rateLimitKey = `ratelimit:v2:client:${context.clientId}`;
      }
    }

    if (!context) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Rate Limiting
    const window = 60;
    const currentRequests = await this.redis.incr(rateLimitKey);
    if (currentRequests === 1) {
      await this.redis.expire(rateLimitKey, window);
    }

    if (currentRequests > rateLimit) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    request.v2Context = context;
    return true;
  }
}
