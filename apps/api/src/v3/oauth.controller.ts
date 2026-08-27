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

  /**
   * Helper utility to generate strong M2M client credentials (clientId and clientSecret)
   */
  public static generateCredentials() {
    return {
      clientId: `m2m_${crypto.randomBytes(12).toString('hex')}`,
      clientSecret: `sk_m2m_${crypto.randomBytes(24).toString('hex')}`,
    };
  }

  private verifySecret(providedSecret: string, storedSecret: string): boolean {
    if (!storedSecret) return false;
    try {
      const hashedSecret = crypto.createHash('sha256').update(providedSecret).digest('hex');
      const providedSecretHash = crypto.createHash('sha256').update(providedSecret).digest();
      const storedSecretHash = crypto.createHash('sha256').update(storedSecret).digest();
      const providedSecretHashedHash = crypto.createHash('sha256').update(hashedSecret).digest();

      const isPlainValid = storedSecretHash.length === providedSecretHash.length && crypto.timingSafeEqual(providedSecretHash, storedSecretHash);
      const isHashedValid = storedSecretHash.length === providedSecretHashedHash.length && crypto.timingSafeEqual(providedSecretHashedHash, storedSecretHash);

      return isPlainValid || isHashedValid;
    } catch (cryptoError) {
      console.error('[OAuth Token Error] Cryptographic comparison error:', cryptoError);
      return false;
    }
  }

  @AllowAnonymous()
  @Post('token')
  @ApiOperation({
    summary: 'Exchange client credentials for a V3 access token',
    description: `
Generates a bearer token for Machine-to-Machine (M2M) communication. Supports credentials from both Organization M2M applications and OAuthClient M2M connections.

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

      // 2. Fetch Organization or OAuthClient
      let org: any = null;
      let oauthClient: any = null;

      try {
        org = await prisma.organization.findUnique({
          where: { clientId: client_id },
        });
      } catch (dbError) {
        console.error(`[OAuth Token Error] Database query failed checking Organization for clientId "${client_id}":`, dbError);
      }

      if (!org) {
        try {
          oauthClient = await prisma.oAuthClient.findUnique({
            where: { clientId: client_id },
          });
        } catch (dbError) {
          console.error(`[OAuth Token Error] Database query failed checking OAuthClient for clientId "${client_id}":`, dbError);
          throw new InternalServerErrorException('Failed to verify client credentials due to a database error.');
        }
      }

      if (!org && !oauthClient) {
        console.warn(`[OAuth Token Error] Client ID not found in Organization or OAuthClient: "${client_id}"`);
        throw new UnauthorizedException('Invalid client credentials');
      }

      // Handle Organization M2M Credentials
      if (org) {
        const storedSecret = org.clientSecret;

        // Verify Secret
        const isValid = this.verifySecret(client_secret, storedSecret);
        if (!isValid) {
          console.warn(`[OAuth Token Error] Invalid client_secret provided for org client_id: "${client_id}"`);
          throw new UnauthorizedException('Invalid client credentials: The provided client_secret is incorrect.');
        }

        // IP Allowlist Check
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

        // Scope Validation
        const requestedScopes = scope ? scope.split(' ') : [];
        const allowedScopes = org.scopes || [];

        if (allowedScopes.length > 0 && allowedScopes[0] !== '*') {
          const unauthorizedScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
          if (unauthorizedScopes.length > 0) {
            console.warn(`[OAuth Token Error] Forbidden scopes "${unauthorizedScopes.join(', ')}" requested by client_id "${client_id}"`);
            throw new ForbiddenException(`Unauthorized scopes requested: ${unauthorizedScopes.join(', ')}`);
          }
        }

        // Ensure OAuthClient record exists for foreign key constraint on OAuthAccessToken
        await prisma.oAuthClient.upsert({
          where: { clientId: client_id },
          create: {
            clientId: client_id,
            name: org.name || `Organization M2M ${client_id}`,
            clientSecret: storedSecret,
            scopes: org.scopes || ['*'],
            grantTypes: ['client_credentials'],
          },
          update: {
            clientSecret: storedSecret,
            scopes: org.scopes || ['*'],
          },
        }).catch(err => {
          console.warn(`[OAuth Token Warning] Failed to upsert oAuthClient for org client_id "${client_id}":`, err);
        });

        const scopesToIssue = scope || (allowedScopes.length ? allowedScopes.join(' ') : '*');
        return await this.issueToken(client_id, client_id, `m2m:${org.id}`, scopesToIssue);
      }

      // Handle OAuthClient M2M Credentials
      if (oauthClient) {
        const storedSecret = oauthClient.clientSecret;

        // Verify Secret
        const isValid = this.verifySecret(client_secret, storedSecret);
        if (!isValid) {
          console.warn(`[OAuth Token Error] Invalid client_secret provided for OAuthClient client_id: "${client_id}"`);
          throw new UnauthorizedException('Invalid client credentials: The provided client_secret is incorrect.');
        }

        // IP Allowlist Check (from metadata if configured)
        const allowedIps = (oauthClient.metadata as any)?.allowedIps || [];
        if (allowedIps.length > 0) {
          const clientIp = req.ip || req.socket?.remoteAddress;
          let normalizedIp = clientIp || '';
          if (normalizedIp.startsWith('::ffff:')) {
            normalizedIp = normalizedIp.substring(7);
          }

          const isAllowed = allowedIps.includes(normalizedIp) || (clientIp && allowedIps.includes(clientIp));
          if (!isAllowed) {
            console.warn(`[OAuth Token Error] IP restricted: IP "${clientIp}" (normalized: "${normalizedIp}") not in allowed list for OAuthClient client_id "${client_id}"`);
            throw new ForbiddenException(`Access denied: IP address "${clientIp}" is not in the allowlist.`);
          }
        }

        // Scope Validation
        const requestedScopes = scope ? scope.split(' ') : [];
        const allowedScopes = oauthClient.scopes || [];

        if (allowedScopes.length > 0 && allowedScopes[0] !== '*') {
          const unauthorizedScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
          if (unauthorizedScopes.length > 0) {
            console.warn(`[OAuth Token Error] Forbidden scopes "${unauthorizedScopes.join(', ')}" requested by OAuthClient client_id "${client_id}"`);
            throw new ForbiddenException(`Unauthorized scopes requested: ${unauthorizedScopes.join(', ')}`);
          }
        }

        const scopesToIssue = scope || (allowedScopes.length ? allowedScopes.join(' ') : '*');
        const userId = oauthClient.userId || `m2m:${oauthClient.id}`;

        return await this.issueToken(client_id, client_id, userId, scopesToIssue);
      }

      throw new UnauthorizedException('Invalid client credentials');
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
    dbClientId: string,
    publicClientId: string,
    userId: string,
    scope: string
  ) {
    try {
      const rawToken = `oat_${crypto.randomBytes(32).toString('hex')}`;
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      const accessToken = await prisma.oAuthAccessToken.create({
        data: {
          id: crypto.randomBytes(16).toString('hex'),
          token: hashedToken,
          clientId: dbClientId,
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
      console.error(`[OAuth Token Error] Database error creating access token for clientId "${publicClientId}":`, error);
      throw new InternalServerErrorException('Failed to generate access token.');
    }
  }
}
