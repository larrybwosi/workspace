import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { auth } from '@repo/auth';
import { prisma } from '@repo/database';
import { fromNodeHeaders } from 'better-auth/node';
import * as crypto from 'crypto';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest();

    // Scaling Optimization: If the global guard already validated the session and attached user details,
    // reuse it to avoid redundant database calls.
    if (request.session && request.user) {
      return true;
    }

    const authHeader = request.headers.authorization || request.headers.Authorization || '';
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();

      // Check M2M OAuth Token (oat_)
      if (token.startsWith('oat_')) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const oauthToken = await prisma.oAuthAccessToken.findUnique({
          where: { token: hashedToken },
        });

        if (!oauthToken || (oauthToken.expiresAt && oauthToken.expiresAt < new Date())) {
          throw new UnauthorizedException('Invalid or expired OAuth token');
        }

        let userId = oauthToken.userId || oauthToken.clientId || '';
        let orgId = '';
        if (oauthToken.referenceId && oauthToken.referenceId.startsWith('m2m:')) {
          orgId = oauthToken.referenceId.split(':')[1];
        }

        let user: any = null;
        if (userId && !userId.startsWith('m2m:')) {
          user = await prisma.user.findUnique({ where: { id: userId } });
        }

        if (!user && orgId) {
          /**
           * ⚡ Performance Optimization:
           * Consolidates bot application retrieval and workspace owner fallback into a single
           * `prisma.workspace.findFirst` query with nested `botApplications` and `owner` selection.
           * This cuts database round-trips from 2 to 1 and leverages direct indexing on `organizationId`.
           */
          const firstWorkspace = await prisma.workspace.findFirst({
            where: { organizationId: orgId },
            select: {
              owner: true,
              botApplications: {
                where: { botId: { not: null } },
                select: { bot: true },
                take: 1,
              },
            },
          });
          if (firstWorkspace) {
            user = firstWorkspace.botApplications[0]?.bot || firstWorkspace.owner;
          }
        }

        const virtualUser = user || {
          id: userId || `m2m-${oauthToken.clientId}`,
          name: `M2M (${oauthToken.clientId})`,
          email: `${oauthToken.clientId}@m2m.local`,
          role: 'admin',
          isBot: true,
        };

        request.user = virtualUser;
        request.session = {
          id: oauthToken.id,
          userId: virtualUser.id,
          expiresAt: oauthToken.expiresAt || new Date(Date.now() + 3600000),
        };
        return true;
      }

      // Check Workspace API Token (wst_)
      if (token.startsWith('wst_')) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const apiToken = await prisma.workspaceApiToken.findUnique({
          where: { token: hashedToken },
          include: { workspace: true, createdBy: true },
        });

        if (!apiToken || (apiToken.expiresAt && apiToken.expiresAt < new Date())) {
          throw new UnauthorizedException('Invalid or expired API token');
        }

        await prisma.workspaceApiToken.update({
          where: { id: apiToken.id },
          data: {
            lastUsedAt: new Date(),
            usageCount: { increment: 1 },
          },
        });

        const user = apiToken.createdBy || {
          id: apiToken.createdById,
          name: apiToken.name,
          email: `${apiToken.id}@token.local`,
          role: 'admin',
          isBot: true,
        };

        request.user = user;
        request.session = {
          id: apiToken.id,
          userId: user.id,
          workspaceId: apiToken.workspaceId,
        };
        return true;
      }
    }

    // 1. Safely parse headers using better-auth node utilities
    const headers = fromNodeHeaders(request.headers);
    this.inject(headers);

    try {
      // 2. better-auth resolves the session using either cookies or the Bearer token
      const sessionData = await auth.api.getSession({
        headers,
      });

      // 3. Reject if no valid session or token is found
      if (!sessionData) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // 4. Attach session and user details directly to the request object
      request.user = sessionData.user;
      request.session = sessionData.session;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private inject(headers: Headers): void {
    const h = headers.get('authorization') || '';
    if (!h.startsWith('Bearer ')) return;
    const t = h.split(' ')[1];

    const keys = [
      'better-auth.session_token',
      'better-auth.session-token',
      '__Secure-better-auth.session_token',
      '__Secure-better-auth.session-token',
    ];
    const cookie = headers.get('cookie') || '';

    let updatedCookie = cookie;
    for (const k of keys) {
      if (t && !cookie.includes(k)) {
        updatedCookie = updatedCookie ? `${updatedCookie}; ${k}=${t}` : `${k}=${t}`;
      }
    }

    if (updatedCookie !== cookie) {
      headers.set('cookie', updatedCookie);
    }
  }
}
