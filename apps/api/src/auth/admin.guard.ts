import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { auth } from './better-auth';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Use the new better-auth system from the dev branch
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check for both 'admin' and 'Admin' to prevent breaking changes during the migration
    const userRole = session.user.role?.toLowerCase();
    if (userRole !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    // Attach user and session to the request object for downstream use
    request.user = session.user;
    request.session = session.session;

    return true;
  }
}