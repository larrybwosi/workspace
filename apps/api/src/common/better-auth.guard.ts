import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { auth } from '@repo/auth';
import { fromNodeHeaders } from 'better-auth/node';

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

    // 1. Safely parse headers using better-auth node utilities
    const headers = fromNodeHeaders(request.headers);

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
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
