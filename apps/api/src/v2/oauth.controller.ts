import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';
import { z } from 'zod';

const tokenRequestSchema = z.object({
  grant_type: z.enum(['client_credentials']),
  client_id: z.string(),
  client_secret: z.string(),
  scope: z.string().optional(),
});

@Controller('v2/oauth')
export class V2OAuthController {
  @Post('token')
  async getToken(@Body() body: any) {
    const validatedData = tokenRequestSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { client_id, client_secret, scope } = validatedData.data;

    const botApp = await prisma.botApplication.findUnique({
      where: { clientId: client_id },
      include: { bot: true },
    });

    if (!botApp || botApp.clientSecret !== client_secret) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    // For Client Credentials flow, we can issue a JWT or a reference token.
    // Given the existing ApiV2Guard handles wst_ and better-auth tokens,
    // we can create a temporary workspace-independent token or a session-like token.
    // However, the requirement is "remote interaction with the workspace".
    // A bot application might be linked to multiple workspaces or have global access.

    // For now, let's use a signed JWT-like token or a reference to a Personal Access Token / API Token if appropriate.
    // Or we can just return a token that the ApiV2Guard will recognize.

    // Let's create a specialized token for this bot interaction.
    const rawToken = `oat_${crypto.randomBytes(32).toString('hex')}`;
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    // We'll store this in Redis or DB. Let's use a reference token for simplicity and security.
    const accessToken = await prisma.oAuthAccessToken.create({
      data: {
        token: hashedToken,
        clientId: client_id,
        userId: botApp.botId!,
        expiresAt,
        scopes: scope ? scope.split(' ') : ['*'],
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
