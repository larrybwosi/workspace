import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '../auth.guard';
import { CurrentUser } from '../current-user.decorator';
import { nanoid } from 'nanoid';

// Simple in-memory store for QR codes (in production, use Redis)
const qrSessions = new Map<string, { status: string; userId?: string; token?: string }>();

@Controller('auth/device')
export class DeviceAuthController {
  @Post('qr/generate')
  async generateQR() {
    const sessionId = nanoid();
    qrSessions.set(sessionId, { status: 'pending' });

    // Auto-expire session after 2 minutes
    setTimeout(() => qrSessions.delete(sessionId), 120000);

    return { sessionId };
  }

  @Get('qr/status/:sessionId')
  async checkStatus(@Param('sessionId') sessionId: string) {
    const session = qrSessions.get(sessionId);
    if (!session) return { status: 'expired' };
    return session;
  }

  @Post('qr/authorize')
  @UseGuards(AuthGuard)
  async authorize(@Body() body: { sessionId: string }, @CurrentUser() user: any) {
    const session = qrSessions.get(body.sessionId);
    if (!session) throw new Error('Session not found or expired');

    // In a real scenario, you'd generate a long-lived session token here
    const tempToken = nanoid(64);

    qrSessions.set(body.sessionId, {
      status: 'authorized',
      userId: user.id,
      token: tempToken
    });

    return { success: true };
  }
}
