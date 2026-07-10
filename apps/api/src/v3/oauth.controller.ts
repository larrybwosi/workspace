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

export class V3TokenRequestDto {
  @IsEnum(['client_credentials'])
  @ApiProperty({ example: 'client_credentials', enum: ['client_credentials'], description: 'The OAuth2 grant type. Must be client_credentials.' })
  grant_type: 'client_credentials';

  @IsString()
  @ApiProperty({ example: 'your_client_id', description: 'The unique Client ID for your M2M application.' })
  client_id: string;

  @IsString()
  @ApiProperty({ example: 'your_client_secret', description: 'The Client Secret for authentication.' })
  client_secret: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'provisioning:workspaces', required: false, description: 'Space-separated list of scopes requested.' })
  scope?: string;
}

const tokenRequestSchema = z.object({
  grant_type: z.enum(['client_credentials']),
  client_id: z.string(),
  client_secret: z.string(),
  scope: z.string().optional(),
});

@ApiTags('V3 Authentication')
@Controller('v3/oauth')
export class V3OAuthController {
  private formatResponse<T>(data: T) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('token')
  @ApiOperation({
    summary: 'Exchange client credentials for a V3 access token',
    description: `
Generates a bearer token for Machine-to-Machine (M2M) communication.

**Supported Scopes:**
- \`*\`: Full access
- \`provisioning:workspaces\`: Manage organizations and workspaces
- \`messages:read\`: Read messages
- \`messages:send\`: Send messages
- \`channels:read\`: Read channel listings
- \`channels:write\`: Create or update channels
- \`webhooks:read\`: Query webhook registries
- \`webhooks:write\`: Provision or configure webhooks
    `,
  })
  @ApiBody({ type: V3TokenRequestDto })
  @ApiResponse({
    status: 200,
    description: 'OAuth2 access token generated successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string', example: 'oat_f3a7...' },
            token_type: { type: 'string', example: 'Bearer' },
            expires_in: { type: 'integer', example: 3600 },
            scope: { type: 'string', example: 'provisioning:workspaces messages:send' },
          },
        },
        timestamp: { type: 'string', example: '2026-07-10T06:25:22.704Z' }
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid payload or missing arguments.' })
  @ApiResponse({ status: 401, description: 'Invalid client credentials.' })
  @ApiResponse({ status: 403, description: 'Access denied due to IP allowlist or scope constraints.' })
  async getToken(@Req() req: any, @Body() body: V3TokenRequestDto) {
    const validatedData = tokenRequestSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { client_id, client_secret, scope } = validatedData.data;

    // Find Bot / M2M application by clientId
    const app = await prisma.botApplication.findUnique({
      where: { clientId: client_id },
      include: { bot: true },
    });

    if (app) {
      const hashedSecret = crypto.createHash('sha256').update(client_secret).digest('hex');

      // Timing-safe constant-time comparison using SHA-256 hashes to prevent timing attacks
      const providedSecretHash = crypto.createHash('sha256').update(client_secret).digest();
      const appSecretHash = crypto.createHash('sha256').update(app.clientSecret).digest();
      const providedSecretHashedHash = crypto.createHash('sha256').update(hashedSecret).digest();

      const isPlainValid = crypto.timingSafeEqual(providedSecretHash, appSecretHash);
      const isHashedValid = crypto.timingSafeEqual(providedSecretHashedHash, appSecretHash);
      const isValid = isPlainValid || isHashedValid;

      if (!isValid) {
        throw new UnauthorizedException('Invalid client credentials: The provided client_secret is incorrect.');
      }

      // IP Whitelisting Check (Enterprise feature)
      if (app.allowedIps && app.allowedIps.length > 0) {
        const clientIp = req.ip || req.socket.remoteAddress;
        let normalizedIp = clientIp || '';
        if (normalizedIp.startsWith('::ffff:')) {
          normalizedIp = normalizedIp.substring(7);
        }

        const isAllowed = app.allowedIps.includes(normalizedIp) || (clientIp && app.allowedIps.includes(clientIp));
        if (!isAllowed) {
          throw new ForbiddenException(`Access denied: IP address "${clientIp}" is not in the allowlist.`);
        }
      }

      // Scope Check
      const requestedScopes = scope ? scope.split(' ') : [];
      const allowedScopes = app.scopes;

      if (allowedScopes.length > 0 && allowedScopes[0] !== '*') {
        const unauthorizedScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
        if (unauthorizedScopes.length > 0) {
          throw new ForbiddenException(`Unauthorized scopes requested: ${unauthorizedScopes.join(', ')}`);
        }
      }

      const scopesToIssue = scope || (allowedScopes.length ? allowedScopes.join(' ') : '*');

      if (app.organizationId) {
        // Issue token for Machine-to-Machine context
        return this.issueToken(client_id, `m2m:${app.organizationId}`, scopesToIssue);
      } else {
        // Issue token for User/Bot context
        return this.issueToken(client_id, app.botId!, scopesToIssue);
      }
    }

    throw new UnauthorizedException('Invalid client credentials');
  }

  private async issueToken(clientId: string, userId: string, scope: string) {
    const rawToken = `oat_${crypto.randomBytes(32).toString('hex')}`;
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiration

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

    return this.formatResponse({
      access_token: rawToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: accessToken.scopes.join(' '),
    });
  }
}
