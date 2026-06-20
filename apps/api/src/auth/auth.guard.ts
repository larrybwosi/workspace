import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { auth } from './better-auth';

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
    const headers = { ...request.headers };
    const authHeader = headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const sessionKey = 'better-auth.session_token';

      if (!headers.cookie?.includes(sessionKey)) {
        const sessionCookie = `${sessionKey}=${token}`;
        headers.cookie = headers.cookie ? `${headers.cookie}; ${sessionCookie}` : sessionCookie;
      }
    }

    return headers;
  }
}
