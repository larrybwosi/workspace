import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';
import { z } from 'zod';

class TokenRequestDto {
  @ApiProperty({ example: 'client_credentials', enum: ['client_credentials'] })
  grant_type: 'client_credentials';

  @ApiProperty({ example: 'your_client_id' })
  client_id: string;

  @ApiProperty({ example: 'your_client_secret' })
  client_secret: string;

  @ApiProperty({ example: 'provisioning:workspaces', required: false })
  scope?: string;
}

const tokenRequestSchema = z.object({
  grant_type: z.enum(['client_credentials']),
  client_id: z.string(),
  client_secret: z.string(),
  scope: z.string().optional(),
});

@ApiTags('Authentication')
@Controller('v2/oauth')
export class V2OAuthController {
  @Post('token')
  @ApiOperation({ summary: 'Exchange client credentials for an access token', description: 'Used for bot, integration, and M2M authentication.' })
  @ApiBody({ type: TokenRequestDto })
  @ApiResponse({ status: 200, description: 'Access token returned successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid client credentials.' })
  async getToken(@Req() req: any, @Body() body: TokenRequestDto) {
    const validatedData = tokenRequestSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { client_id, client_secret, scope } = validatedData.data;

    // 1. Try Bot Application
    const botApp = await prisma.botApplication.findUnique({
      where: { clientId: client_id },
      include: { bot: true },
    });

    if (botApp) {
      if (botApp.clientSecret !== client_secret) {
        throw new UnauthorizedException('Invalid client credentials');
      }

      return this.issueToken(client_id, botApp.botId!, scope, 'bot');
    }

    // 2. Try M2M Application
    const m2mApp = await prisma.m2mApplication.findUnique({
      where: { clientId: client_id },
    });

    if (m2mApp) {
      if (m2mApp.clientSecret !== client_secret) {
        throw new UnauthorizedException('Invalid client credentials');
      }

      // Enterprise Feature: IP Whitelisting
      if (m2mApp.allowedIps && m2mApp.allowedIps.length > 0) {
        const clientIp = req.ip || req.socket.remoteAddress;
        if (!clientIp || !m2mApp.allowedIps.includes(clientIp)) {
          throw new ForbiddenException('IP not allowed');
        }
      }

      // Check scopes
      const requestedScopes = scope ? scope.split(' ') : [];
      const allowedScopes = m2mApp.scopes;

      const unauthorizedScopes = requestedScopes.filter(s => !allowedScopes.includes(s) && allowedScopes[0] !== '*');
      if (unauthorizedScopes.length > 0) {
        throw new ForbiddenException(`Unauthorized scopes: ${unauthorizedScopes.join(', ')}`);
      }

      return this.issueToken(client_id, `m2m:${m2mApp.organizationId}`, scope || allowedScopes.join(' '), 'm2m');
    }

    throw new UnauthorizedException('Invalid client credentials');
  }

  private async issueToken(clientId: string, userId: string, scope: string | undefined, type: string) {
    const rawToken = `oat_${crypto.randomBytes(32).toString('hex')}`;
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    const accessToken = await (prisma as any).oauthAccessToken.create({
      data: {
        id: crypto.randomBytes(16).toString('hex'),
        token: hashedToken,
        clientId: clientId,
        userId: userId,
        expiresAt,
        scopes: scope ? scope.split(' ') : ['*'],
        createdAt: new Date(),
      },
    });

    return {
      access_token: rawToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: accessToken.scopes.join(' '),
    };
  }
}
