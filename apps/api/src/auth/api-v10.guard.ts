import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import type { prisma } from '@repo/database';
import * as crypto from 'crypto';

@Injectable()
export class ApiV10Guard implements CanActivate {
  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bot ')) {
      throw new UnauthorizedException('Missing or invalid bot token');
    }

    const token = authHeader.split(' ')[1];
    const userId = this.validateBotToken(token);
    if (!userId) {
      throw new UnauthorizedException('Invalid bot token');
    }

    const bot = await prisma.user.findFirst({
      where: { id: userId, isBot: true, botToken: token },
      include: { botApplication: true },
    });

    if (!bot) {
      throw new UnauthorizedException('Bot not found or token mismatch');
    }

    // Attach bot to request
    request.bot = bot;
    return true;
  }

  private validateBotToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [base64Id, timestamp, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', process.env.BOT_TOKEN_SECRET || 'default_secret')
        .update(`${base64Id}.${timestamp}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const userId = Buffer.from(base64Id, 'base64').toString('utf-8');
      return userId;
    } catch (error) {
      return null;
    }
  }
}
