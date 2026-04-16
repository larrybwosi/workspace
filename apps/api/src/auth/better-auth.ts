import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@repo/database';
import { admin, jwt, organization } from 'better-auth/plugins';
import { validateEnv } from '@repo/shared/server';

const env = validateEnv();

const getBaseURL = () => {
  const url = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  if (url.includes('/api/auth')) {
    return url;
  }
  return url.replace(/\/$/, '') + '/api/auth';
};
const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [];
export const auth: any = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: getBaseURL(),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: allowedOrigins,
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
      },
    },
  },
  plugins: [jwt(), organization(), admin() as any],
}) as any;
