import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  HttpException,
  UseFilters,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { V3ExceptionFilter } from './v3-exception.filter';
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
@UseFilters(V3ExceptionFilter)
export class V3OAuthController {
  private readonly logger = new Logger(V3OAuthController.name);

  private formatResponse<T>(data: T) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @AllowAnonymous()
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
    try {
      // 1. Validate Payload
      const validatedData = tokenRequestSchema.safeParse(body);
      if (!validatedData.success) {
        console.error('[OAuth Token Error] Validation failed:', validatedData.error.issues);
        throw new BadRequestException(validatedData.error.issues);
      }

      const { client_id, client_secret, scope } = validatedData.data;

      // 2. Fetch Organization
      let org;
      try {
        org = await prisma.organization.findUnique({
          where: { clientId: client_id },
        });
      } catch (dbError) {
        console.error(`[OAuth Token Error] Database query failed for clientId "${client_id}":`, dbError);
        throw new InternalServerErrorException('Failed to verify client credentials due to a database error.');
      }

      if (!org) {
        console.warn(`[OAuth Token Error] Client ID not found: "${client_id}"`);
        throw new UnauthorizedException('Invalid client credentials');
      }

      // 3. Verify Secret
      let isValid = false;
      try {
        const hashedSecret = crypto.createHash('sha256').update(client_secret).digest('hex');
        const providedSecretHash = crypto.createHash('sha256').update(client_secret).digest();
        const orgSecretHash = crypto.createHash('sha256').update(org.clientSecret || '').digest();
        const providedSecretHashedHash = crypto.createHash('sha256').update(hashedSecret).digest();

        const isPlainValid = orgSecretHash.length === providedSecretHash.length && crypto.timingSafeEqual(providedSecretHash, orgSecretHash);
        const isHashedValid = orgSecretHash.length === providedSecretHashedHash.length && crypto.timingSafeEqual(providedSecretHashedHash, orgSecretHash);

        isValid = isPlainValid || isHashedValid;
      } catch (cryptoError) {
        console.error(`[OAuth Token Error] Cryptographic comparison error for client_id "${client_id}":`, cryptoError);
        throw new UnauthorizedException('Invalid client credentials');
      }

      if (!isValid) {
        console.warn(`[OAuth Token Error] Invalid client_secret provided for client_id: "${client_id}"`);
        throw new UnauthorizedException('Invalid client credentials: The provided client_secret is incorrect.');
      }

      // 4. IP Allowlist Check
      if (org.allowedIps && org.allowedIps.length > 0) {
        const clientIp = req.ip || req.socket?.remoteAddress;
        let normalizedIp = clientIp || '';
        if (normalizedIp.startsWith('::ffff:')) {
          normalizedIp = normalizedIp.substring(7);
        }

        const isAllowed = org.allowedIps.includes(normalizedIp) || (clientIp && org.allowedIps.includes(clientIp));
        if (!isAllowed) {
          console.warn(`[OAuth Token Error] IP restricted: IP "${clientIp}" (normalized: "${normalizedIp}") not in allowed list for client_id "${client_id}"`);
          throw new ForbiddenException(`Access denied: IP address "${clientIp}" is not in the allowlist.`);
        }
      }

      // 5. Scope Validation
      const requestedScopes = scope ? scope.split(' ') : [];
      const allowedScopes = org.scopes || [];

      if (allowedScopes.length > 0 && allowedScopes[0] !== '*') {
        const unauthorizedScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
        if (unauthorizedScopes.length > 0) {
          console.warn(`[OAuth Token Error] Forbidden scopes "${unauthorizedScopes.join(', ')}" requested by client_id "${client_id}"`);
          throw new ForbiddenException(`Unauthorized scopes requested: ${unauthorizedScopes.join(', ')}`);
        }
      }

        const scopesToIssue = scope || (allowedScopes.length ? allowedScopes.join(' ') : '*');

        // 6. Token Issuance
        return await this.issueToken(client_id, `m2m:${org.id}`, scopesToIssue, org.name);

    } catch (error) {
      // Re-throw NestJS HttpExceptions so filters handle them correctly
      if (error instanceof HttpException) {
        throw error;
      }

      // Catch unexpected errors
      console.error('[OAuth Token Error] Unexpected failure in getToken endpoint:', error);
      throw new InternalServerErrorException('An unexpected error occurred while processing the token request.');
    }
  }

  private async issueToken(
    publicClientId: string,
    userId: string,
    scope: string,
    orgName?: string
  ) {
    try {
      const rawToken = `oat_${crypto.randomBytes(32).toString('hex')}`;
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      // Ensure OAuthClient record exists to satisfy foreign key constraint on oauth_access_tokens(clientId)
      await prisma.oAuthClient.upsert({
        where: { clientId: publicClientId },
        update: {
          name: orgName || 'M2M Application',
        },
        create: {
          clientId: publicClientId,
          name: orgName || 'M2M Application',
          redirectUris: [],
        },
      });

      const accessToken = await prisma.oAuthAccessToken.create({
        data: {
          id: crypto.randomBytes(16).toString('hex'),
          token: hashedToken,
          clientId: publicClientId,
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
    } catch (error) {
      console.error(`[OAuth Token Error] Database error creating access token for clientId "${publicClientId}":`, error.message);
      throw new InternalServerErrorException('Failed to generate access token.');
    }
  }
}
