import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { auth } from '@repo/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = this.extractAuthHeaders(request);

    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    request.user = session.user;
    request.session = session.session;

    return true;
  }

  private extractAuthHeaders(request: any): Record<string, string> {
    const headers: Record<string, string> = {};

    // Ensure all headers are strings
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(', ');
      }
    }

    const authHeader = headers.authorization || headers.Authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const sessionKey = 'better-auth.session_token';

      // Inject token into cookie if not present, as some Better Auth
      // configurations prioritize cookies for session retrieval.
      if (!headers.cookie?.includes(sessionKey)) {
        const sessionCookie = `${sessionKey}=${token}`;
        headers.cookie = headers.cookie ? `${headers.cookie}; ${sessionCookie}` : sessionCookie;
      }
    }

    return headers;
  }
}
