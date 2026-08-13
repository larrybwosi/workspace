import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class AuthHeaderMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    let token = '';

    // 1. Check Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Query parameters fallback (safe for both Express and Fastify)
    if (!token && req.url) {
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        const tokenParam = urlObj.searchParams.get('token') || urlObj.searchParams.get('session_token');
        if (tokenParam) {
          token = tokenParam.trim();
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // 3. Inject token as cookies if found
    if (token) {
      // Ensure Authorization header is present
      if (!req.headers.authorization && !req.headers.Authorization) {
        req.headers.authorization = `Bearer ${token}`;
      }

      const keys = [
        'better-auth.session_token',
        'better-auth.session-token',
        '__Secure-better-auth.session_token',
        '__Secure-better-auth.session-token',
      ];
      const cookie = req.headers.cookie || '';

      let updatedCookie = typeof cookie === 'string' ? cookie : '';

      for (const k of keys) {
        if (!updatedCookie.includes(k)) {
          updatedCookie = updatedCookie
            ? `${updatedCookie}; ${k}=${token}`
            : `${k}=${token}`;
        }
      }

      req.headers.cookie = updatedCookie;
    }

    next();
  }
}
