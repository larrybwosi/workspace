import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Req,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { AuthGuard } from '../auth.guard';
import { auth } from '@repo/auth';
import { publishRealtime } from '@repo/shared/server';

/**
 * OAuth client id for the desktop app. If you want to restrict which
 * clients can request device codes, add a `validateClient` check for
 * this value on the `deviceAuthorization` plugin config in `@repo/auth`.
 */
const DEVICE_CLIENT_ID = 'desktop-app';

function extractUserCode(input: string): string {
  if (!input) return '';
  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      const url = new URL(input);
      const code = url.searchParams.get('user_code') || url.searchParams.get('userCode');
      if (code) return code;

      const parts = url.pathname.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.length >= 4) {
        return lastPart;
      }
    } catch (e) {
      console.error('Failed to parse user code from URL', e);
    }
  }
  return input;
}

@Controller('device-auth')
export class DeviceAuthController {
  /**
   * Called by the desktop app to start the flow. Returns a device_code
   * (kept private, used only for polling) and a user_code (safe to embed
   * in the QR code / show on screen for the user to confirm).
   */
  @Post('qr/generate')
  async generateQR() {
    const data = await auth.api.deviceCode({
      body: { client_id: DEVICE_CLIENT_ID },
    });

    return {
      deviceCode: data.device_code,
      userCode: data.user_code,
      verificationUri: data.verification_uri,
      verificationUriComplete: data.verification_uri_complete,
      expiresIn: data.expires_in,
      interval: data.interval ?? 5,
    };
  }

  /**
   * Polled by the desktop app using the device_code from qr/generate.
   * Mirrors RFC 8628 error codes so the caller knows whether to keep
   * polling, back off, or stop.
   */
  @Get('qr/status/:deviceCode')
  async checkStatus(@Param('deviceCode') deviceCode: string) {
    try {
      const data = await auth.api.deviceToken({
        body: {
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: deviceCode,
          client_id: DEVICE_CLIENT_ID,
        },
      });

      if (data?.access_token) {
        return { status: 'authorized', token: data.access_token };
      }
      return { status: 'pending' };
    } catch (error: any) {
      const code = error?.body?.error ?? error?.error;
      switch (code) {
        case 'authorization_pending':
          return { status: 'pending' };
        case 'slow_down':
          return { status: 'pending', slowDown: true };
        case 'access_denied':
          return { status: 'denied' };
        case 'expired_token':
          return { status: 'expired' };
        default:
          throw new BadRequestException(error?.body?.error_description ?? 'Invalid or unknown device code');
      }
    }
  }

  /**
   * Called by the authenticated mobile client after scanning the QR code
   * (or typing the user_code). Approves the pending device code so the
   * desktop app's next poll returns an access token.
   */
  @Post('qr/authorize')
  @UseGuards(AuthGuard)
  async authorize(
    @Body() body: { userCode?: string; sessionId?: string },
    @Req() req: FastifyRequest
  ) {
    const rawCode = body?.userCode || body?.sessionId;
    if (!rawCode) {
      throw new BadRequestException('userCode is required');
    }

    const userCode = extractUserCode(rawCode);

    try {
      await auth.api.deviceApprove({
        body: { userCode },
        // Fastify normalizes headers into a plain incoming headers object,
        // which matches what fromNodeHeaders expects.
        headers: fromNodeHeaders(req.headers as Record<string, string | string[]>),
      });
    } catch (error: any) {
      if (error?.status === 404 || error?.body?.error === 'invalid_grant') {
        throw new BadRequestException('Session not found or expired');
      }
      if (error?.status === 403 || error?.body?.error === 'access_denied') {
        throw new ForbiddenException('This code belongs to another user');
      }
      throw new InternalServerErrorException('Could not authorize device');
    }

    // Notify the desktop client instantly, in addition to its own
    // polling. Keyed by userCode since that's the only identifier the
    // mobile client has.
    try {
      await publishRealtime(`qr-session:${userCode}`, 'authorized', {
        status: 'authorized',
      });
    } catch (e) {
      console.error('Failed to publish realtime notification for device auth', e);
    }

    return { success: true };
  }

  /**
   * Optional: lets the user explicitly reject a device instead of just
   * ignoring the prompt until it expires.
   */
  @Post('qr/deny')
  @UseGuards(AuthGuard)
  async deny(
    @Body() body: { userCode?: string; sessionId?: string },
    @Req() req: FastifyRequest
  ) {
    const rawCode = body?.userCode || body?.sessionId;
    if (!rawCode) {
      throw new BadRequestException('userCode is required');
    }

    const userCode = extractUserCode(rawCode);

    try {
      await auth.api.deviceDeny({
        body: { userCode },
        headers: fromNodeHeaders(req.headers as Record<string, string | string[]>),
      });
    } catch {
      throw new BadRequestException('Session not found or expired');
    }

    try {
      await publishRealtime(`qr-session:${userCode}`, 'denied', {
        status: 'denied',
      });
    } catch (e) {
      console.error('Failed to publish realtime notification for device auth', e);
    }

    return { success: true };
  }
}
