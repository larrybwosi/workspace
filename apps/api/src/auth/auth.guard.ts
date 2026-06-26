import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { auth } from '@repo/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = this.normalize(request.headers);
    this.inject(headers);

    const session = await auth.api.getSession({ headers });
    if (!session) throw new UnauthorizedException();

    request.user = session.user;
    request.session = session.session;
    return true;
  }

  private normalize(raw: Record<string, any>): Record<string, string> {
    const headers: Record<string, string> = {};
    Object.keys(raw).forEach(k => {
      headers[k] = Array.isArray(raw[k]) ? raw[k].join(', ') : String(raw[k] ?? '');
    });
    return headers;
  }

  private inject(headers: Record<string, string>): void {
    const h = headers.authorization || headers.Authorization || '';
    if (!h.startsWith('Bearer ')) return;
    const t = h.split(' ')[1];
    const k = 'better-auth.session_token';
    if (!t || (headers.cookie && headers.cookie.includes(k))) return;
    headers.cookie = headers.cookie ? `${headers.cookie}; ${k}=${t}` : `${k}=${t}`;
  }
}
