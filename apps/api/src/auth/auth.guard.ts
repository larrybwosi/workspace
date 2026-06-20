import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { auth } from './better-auth';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check for Bearer token in Authorization header for mobile compatibility
    const authHeader = request.headers.authorization;
    let headers = { ...request.headers };

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // When using session tokens via Bearer, we can provide them as a cookie to Better-Auth
      // if it doesn't automatically pick it up from the Authorization header.
      // Better-Auth typically uses 'better-auth.session_token' cookie.
      if (!headers.cookie || !headers.cookie.includes('better-auth.session_token')) {
        const sessionCookie = `better-auth.session_token=${token}`;
        headers.cookie = headers.cookie ? `${headers.cookie}; ${sessionCookie}` : sessionCookie;
      }
    }

    const session = await auth.api.getSession({
      headers: headers,
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    request.user = session.user;
    request.session = session.session;

    return true;
  }
}
