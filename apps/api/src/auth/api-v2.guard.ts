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
import { prisma } from '@repo/database';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import { auth } from '@repo/auth';

export interface ApiV2Context {
  userId: string;
  clientId: string;
  scopes: string[];
  workspaceId?: string;
  workspaceSlug?: string;
  isBot?: boolean;
  tokenId?: string;
  organizationId?: string;
  m2mClientId?: string;
}

@Injectable()
export class ApiV2Guard implements CanActivate {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService
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
      const session = await auth.api
        .getSession({
          headers: request.headers,
        })
        .catch(() => null);

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

      /**
       * ⚡ Performance Optimization:
       * Consolidates organization lookup and membership verification into a single Prisma query.
       * Replaces sequential Better-Auth API calls, reducing database RTT from 2 to 1.
       */
      if (slug) {
        const org = await prisma.organization.findUnique({
          where: { slug },
          select: {
            id: true,
            slug: true,
            members: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          },
        });

        if (!org) {
          throw new NotFoundException('Workspace not found');
        }

        if (org.members.length === 0) {
          throw new ForbiddenException('Forbidden: Not a member of this workspace');
        }

        context.workspaceId = org.id;
        context.workspaceSlug = org.slug;
      } else if (workspaceId) {
        const member = await prisma.member.findFirst({
          where: { organizationId: workspaceId, userId: session.user.id },
          select: { id: true },
        });

        if (!member) {
          throw new ForbiddenException('Forbidden: Not a member of this workspace');
        }

        context.workspaceId = workspaceId;
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
      } else if (accessToken.startsWith('oat_')) {
        const hashedToken = crypto.createHash('sha256').update(accessToken).digest('hex');

        // Try OAuthAccessToken first
        let oauthToken = await (prisma as any).oAuthAccessToken.findUnique({
          where: { token: hashedToken },
        });

        // Fallback to OauthAccessToken (better-auth)
        if (!oauthToken) {
          oauthToken = await (prisma as any).oauthAccessToken.findUnique({
            where: { token: hashedToken },
          });
        }

        if (!oauthToken || (oauthToken.expiresAt && oauthToken.expiresAt < new Date())) {
          throw new UnauthorizedException('Invalid or expired OAuth token');
        }

        context = {
          userId: oauthToken.userId || oauthToken.clientId || '',
          clientId: oauthToken.clientId,
          scopes: oauthToken.scopes,
          isBot: true,
          tokenId: oauthToken.id,
        };

        if (context.userId.startsWith('m2m:')) {
          context.organizationId = context.userId.split(':')[1];
          context.m2mClientId = context.clientId;

          // Enterprise Feature: Scope & IP Enforcement
          const app = await prisma.botApplication.findUnique({
            where: { clientId: context.m2mClientId },
          });

          if (app) {
            // IP Whitelisting
            if (app.allowedIps && app.allowedIps.length > 0) {
              const clientIp = request.ip || request.socket.remoteAddress;
              if (!clientIp || !app.allowedIps.includes(clientIp)) {
                throw new ForbiddenException('IP not allowed');
              }
            }

            // Scope Enforcement
            const requestedScopes = context.scopes;
            const allowedScopes = app.scopes;

            if (allowedScopes.length > 0 && allowedScopes[0] !== '*') {
              const unauthorizedScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
              if (unauthorizedScopes.length > 0) {
                throw new ForbiddenException(`Unauthorized scopes: ${unauthorizedScopes.join(', ')}`);
              }
            }
          }
        }

        /**
         * ⚡ Performance Optimization:
         * Consolidates workspace lookup and membership/M2M authorization into a single Prisma query.
         * For regular users, reduces database RTT from 2 to 1.
         * For M2M, uses a targeted 'Member' check on the workspace owner via relation.
         */
        if (slug) {
          const workspace = await prisma.workspace.findUnique({
            where: { slug },
            select: {
              id: true,
              slug: true,
              ownerId: true,
              organizationId: true,
              members: context.organizationId
                ? undefined
                : {
                    where: { userId: context.userId },
                    select: { id: true },
                  },
              owner: context.organizationId
                ? {
                    select: {
                      members: {
                        where: { organizationId: context.organizationId },
                        select: { id: true },
                      },
                    },
                  }
                : undefined,
            },
          });

          if (!workspace) {
            throw new NotFoundException('Workspace not found');
          }

          if (context.organizationId) {
            // Widen Scope: M2M is authorized if workspace belongs to organization OR if organization has member access to the owner
            const isDirectOrgWorkspace = workspace.organizationId === context.organizationId;
            const owner = workspace.owner as { members: { id: string }[] } | null;
            const hasOwnerAccess = (owner?.members?.length ?? 0) > 0;

            if (!isDirectOrgWorkspace && !hasOwnerAccess) {
              throw new ForbiddenException('M2M application is not authorized to access this workspace');
            }
          } else {
            if (!workspace.members || workspace.members.length === 0) {
              throw new ForbiddenException('Forbidden: Not a member of this workspace');
            }
          }

          context.workspaceId = workspace.id;
          context.workspaceSlug = workspace.slug;
        }

        rateLimit = 1000;
        rateLimitKey = `ratelimit:v2:oauth:${oauthToken.id}`;
      } else {
        const tokenInfo = await (auth.api as any)
          .getOAuthAccessToken({
            headers: request.headers,
            query: { token: accessToken },
          })
          .catch(() => null);

        if (!tokenInfo || new Date(tokenInfo.expiresAt) < new Date()) {
          throw new UnauthorizedException('Invalid or expired token');
        }

        context = {
          userId: tokenInfo.userId,
          clientId: tokenInfo.clientId,
          scopes: tokenInfo.scopes,
        };

        /**
         * ⚡ Performance Optimization:
         * Consolidates organization lookup and membership verification into a single Prisma query.
         * Reduces database RTT by bypassing multiple Better-Auth API round-trips.
         */
        if (slug) {
          const org = await prisma.organization.findUnique({
            where: { slug },
            select: {
              id: true,
              slug: true,
              members: {
                where: { userId: tokenInfo.userId },
                select: { id: true },
              },
            },
          });

          if (!org) {
            throw new NotFoundException('Workspace not found');
          }

          if (org.members.length === 0) {
            throw new ForbiddenException('Forbidden: Not a member of this workspace');
          }

          context.workspaceId = org.id;
          context.workspaceSlug = org.slug;
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
