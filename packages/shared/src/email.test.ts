import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendVerificationEmail, sendSetPasswordEmail } from './email';

describe('email module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('logs mock output when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const res1 = await sendVerificationEmail({
      to: 'test@example.com',
      url: 'http://localhost:3001/verify-email?token=123',
    });

    expect(res1).toEqual({ id: 'mock-email-id' });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Resend Mock Email] Verification Email to: test@example.com')
    );

    const res2 = await sendSetPasswordEmail({
      to: 'test@example.com',
      url: 'http://localhost:3001/reset-password?token=123',
      isNewUser: true,
    });

    expect(res2).toEqual({ id: 'mock-email-id' });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Resend Mock Email] Set/Reset Password Email to: test@example.com')
    );

    consoleSpy.mockRestore();
  });
});
