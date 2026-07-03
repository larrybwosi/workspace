import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';
import { z } from 'zod';
import { IsString, IsOptional, IsEnum } from 'class-validator';

class TokenRequestDto {
  @IsEnum(['client_credentials'])
  @ApiProperty({ example: 'client_credentials', enum: ['client_credentials'] })
  grant_type: 'client_credentials';

  @IsString()
  @ApiProperty({ example: 'your_client_id' })
  client_id: string;

  @IsString()
  @ApiProperty({ example: 'your_client_secret' })
  client_secret: string;

  @IsString()
  @IsOptional()
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
  @ApiOperation({
    summary: 'Exchange client credentials for an access token',
    description: `
Used for bot, integration, and M2M authentication.

**Scopes available:**
- \`*\`: Full access (only for internal system bots).
- \`provisioning:workspaces\`: Ability to create and manage workspaces.
- \`messages:read\`: Read messages in allowed channels.
- \`messages:send\`: Send messages and trigger actions.
- \`channels:read\`: List and view channel details.
- \`channels:write\`: Create and manage channels.
- \`webhooks:read\`: View webhook configurations.
- \`webhooks:write\`: Manage webhooks.
    `,
  })
  @ApiBody({ type: TokenRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Access token returned successfully.',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'oat_...' },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'integer', example: 3600 },
        scope: { type: 'string', example: 'provisioning:workspaces messages:send' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid client credentials.' })
  @ApiResponse({ status: 403, description: 'IP not allowed or unauthorized scopes.' })
  async getToken(@Req() req: any, @Body() body: TokenRequestDto) {
    const validatedData = tokenRequestSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { client_id, client_secret, scope } = validatedData.data;

    // 1. Try Bot / M2M Application
    const app = await prisma.botApplication.findUnique({
      where: { clientId: client_id },
      include: { bot: true },
    });

    if (app) {
      const hashedSecret = crypto.createHash('sha256').update(client_secret).digest('hex');
      const isValid = app.clientSecret === client_secret || app.clientSecret === hashedSecret;

      if (!isValid) {
        throw new UnauthorizedException('Invalid client credentials: The provided client_secret is incorrect.');
      }

      // Enterprise Feature: IP Whitelisting
      if (app.allowedIps && app.allowedIps.length > 0) {
        const clientIp = req.ip || req.socket.remoteAddress;
        if (!clientIp || !app.allowedIps.includes(clientIp)) {
          throw new ForbiddenException(`Access denied: IP address "${clientIp}" is not in the allowlist for this application.`);
        }
      }

      // Check scopes
      const requestedScopes = scope ? scope.split(' ') : [];
      const allowedScopes = app.scopes;

      if (allowedScopes.length > 0 && allowedScopes[0] !== '*') {
        const unauthorizedScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
        if (unauthorizedScopes.length > 0) {
          throw new ForbiddenException(`Unauthorized scopes: ${unauthorizedScopes.join(', ')}`);
        }
      }

      if (app.organizationId) {
        // M2M Application
        return this.issueToken(client_id, `m2m:${app.organizationId}`, scope || (allowedScopes.length ? allowedScopes.join(' ') : '*'), 'm2m');
      } else {
        // Regular Bot Application
        return this.issueToken(client_id, app.botId!, scope || '*', 'bot');
      }
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
