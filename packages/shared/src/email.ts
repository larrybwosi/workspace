import { Resend } from 'resend';
import { validateEnv } from './env';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  const env = validateEnv();
  const apiKey = process.env.RESEND_API_KEY || (env as any).RESEND_API_KEY;
  if (apiKey) {
    resendClient = new Resend(apiKey);
    return resendClient;
  }
  return null;
}

function getFromEmail(): string {
  const env = validateEnv();
  return (
    process.env.RESEND_FROM_EMAIL ||
    (env as any).RESEND_FROM_EMAIL ||
    'Scrymechat <noreply@scryme.tech>'
  );
}

export interface SendVerificationEmailOptions {
  to: string;
  url: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export interface SendSetPasswordEmailOptions {
  to: string;
  url: string;
  user?: {
    name?: string;
    email?: string;
  };
  isNewUser?: boolean;
}

/**
 * Sends a verification email to a user.
 */
export async function sendVerificationEmail(options: SendVerificationEmailOptions) {
  const { to, url, user } = options;
  const resend = getResendClient();
  const from = getFromEmail();
  const recipientName = user?.name || user?.email || to;

  const subject = 'Verify your email address - Scrymechat';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e4e4e7;">
          <h2 style="color: #18181b; margin-top: 0;">Welcome to Scrymechat!</h2>
          <p style="color: #52525b; font-size: 16px; line-height: 1.5;">Hello ${recipientName},</p>
          <p style="color: #52525b; font-size: 16px; line-height: 1.5;">Please click the button below to verify your email address and activate your account:</p>
          <div style="margin: 32px 0;">
            <a href="${url}" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #71717a; font-size: 14px; line-height: 1.5;">If you did not request this email, you can safely ignore it.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Or copy and paste this link into your browser: <br/><a href="${url}" style="color: #2563eb;">${url}</a></p>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log(`[Resend Mock Email] Verification Email to: ${to}, link: ${url}`);
    return { id: 'mock-email-id' };
  }

  return await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });
}

/**
 * Sends a set password / reset password email to a user.
 */
export async function sendSetPasswordEmail(options: SendSetPasswordEmailOptions) {
  const { to, url, user, isNewUser = true } = options;
  const resend = getResendClient();
  const from = getFromEmail();
  const recipientName = user?.name || user?.email || to;

  const subject = isNewUser
    ? 'Set your password - Scrymechat'
    : 'Reset your password - Scrymechat';

  const title = isNewUser ? 'Welcome to Scrymechat' : 'Reset your password';
  const message = isNewUser
    ? 'An account has been created for you. Please click the button below to set your password and access your account:'
    : 'We received a request to reset your password. Click the button below to choose a new password:';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e4e4e7;">
          <h2 style="color: #18181b; margin-top: 0;">${title}</h2>
          <p style="color: #52525b; font-size: 16px; line-height: 1.5;">Hello ${recipientName},</p>
          <p style="color: #52525b; font-size: 16px; line-height: 1.5;">${message}</p>
          <div style="margin: 32px 0;">
            <a href="${url}" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">${isNewUser ? 'Set Password' : 'Reset Password'}</a>
          </div>
          <p style="color: #71717a; font-size: 14px; line-height: 1.5;">If you did not expect this invitation or request, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Or copy and paste this link into your browser: <br/><a href="${url}" style="color: #2563eb;">${url}</a></p>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log(`[Resend Mock Email] Set/Reset Password Email to: ${to}, link: ${url}`);
    return { id: 'mock-email-id' };
  }

  return await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });
}

export interface SendOrganizationInviteEmailOptions {
  to: string;
  url: string;
  organizationName: string;
  inviterName?: string;
  role?: string;
}

/**
 * Sends an organization invitation email to a user.
 */
export async function sendOrganizationInviteEmail(options: SendOrganizationInviteEmailOptions) {
  const { to, url, organizationName, inviterName, role } = options;
  const resend = getResendClient();
  const from = getFromEmail();

  const inviterText = inviterName ? `${inviterName} has invited you` : 'You have been invited';
  const roleText = role ? ` as ${role}` : '';
  const subject = `Invitation to join ${organizationName} on Scrymechat`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e4e4e7;">
          <h2 style="color: #18181b; margin-top: 0;">Organization Invitation</h2>
          <p style="color: #52525b; font-size: 16px; line-height: 1.5;">${inviterText} to join <strong>${organizationName}</strong>${roleText} on Scrymechat.</p>
          <p style="color: #52525b; font-size: 16px; line-height: 1.5;">Click the button below to accept the invitation and join the organization:</p>
          <div style="margin: 32px 0;">
            <a href="${url}" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #71717a; font-size: 14px; line-height: 1.5;">If you did not expect this invitation, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Or copy and paste this link into your browser: <br/><a href="${url}" style="color: #2563eb;">${url}</a></p>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log(`[Resend Mock Email] Organization Invite Email to: ${to}, org: ${organizationName}, link: ${url}`);
    return { id: 'mock-email-id' };
  }

  return await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });
}
