import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { auth } from '@repo/auth';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
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
    const k = 'better-auth.session_token';
    const cookie = headers.get('cookie') || '';
    if (!t || cookie.includes(k)) return;
    const updatedCookie = cookie ? `${cookie}; ${k}=${t}` : `${k}=${t}`;
    headers.set('cookie', updatedCookie);
  }
}
