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
    const headers = this.normalizeHeaders(request.headers);
    this.injectSessionCookie(headers);
    return headers;
  }

  private normalizeHeaders(rawHeaders: Record<string, any>): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawHeaders)) {
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    }
    return headers;
  }

  private injectSessionCookie(headers: Record<string, string>): void {
    const authHeader = headers.authorization || headers.Authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const key = 'better-auth.session_token';

    if (!token || headers.cookie?.includes(key)) return;

    const sessionCookie = `${key}=${token}`;
    headers.cookie = headers.cookie ? `${headers.cookie}; ${sessionCookie}` : sessionCookie;
  }
}
