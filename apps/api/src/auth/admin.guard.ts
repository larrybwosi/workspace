import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { auth } from './better-auth';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    if (session.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    request.user = session.user;
    request.session = session.session;

    return true;
  }
}
