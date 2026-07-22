import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { auth } from '@repo/auth';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Scaling Optimization: If the global guard already validated the session and attached user details,
    // reuse it to avoid redundant database calls.
    if (request.session && request.user) {
      return true;
    }

    const headers = fromNodeHeaders(request.headers);
    this.inject(headers);

    const session = await auth.api.getSession({ headers });
    if (!session) throw new UnauthorizedException();

    request.user = session.user;
    request.session = session.session;
    return true;
  }

  private inject(headers: Headers): void {
    const h = headers.get('authorization') || '';
    if (!h.startsWith('Bearer ')) return;
    const t = h.split(' ')[1];

    const keys = ['better-auth.session_token', 'better-auth.session-token'];
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
