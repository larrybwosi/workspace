import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, jwt, organization } from 'better-auth/plugins';
import { oauthProvider } from '@better-auth/oauth-provider';
import { prisma } from '@/lib/db/prisma';
import { validateEnv } from '@repo/shared';

const env = validateEnv();

const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((origin: string) => origin.trim()) : [];
export const auth: any = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: [
    '*.scryme.tech',
    'https://scryme.tech',
    'https://app.scryme.tech',
    'https://chat.scryme.tech',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  baseURL: {
    allowedHosts: [
      'localhost:*',
      'scryme.tech',
      'app.scryme.tech',
      'crm.scryme.tech',
      'api.scryme.tech',
      '*.scryme.tech',
    ],
    protocol: env.NODE_ENV === 'development' ? 'http' : 'https',
    fallback:
      env.BETTER_AUTH_URL || (env.NODE_ENV === 'production' ? 'https://chat.scryme.tech' : 'http://localhost:3000'),
  },
  plugins: [
    admin({
      defaultRole: 'Member',
    }),
    jwt(),
    organization(),
    oauthProvider({
      loginPage: '/login',
      consentPage: '/consent',
      allowDynamicClientRegistration: true,
      silenceWarnings: {
        oauthAuthServerConfig: true,
      },
      scopes: [
        'openid',
        'profile',
        'email',
        'offline_access',
        'channels:read',
        'channels:write',
        'members:read',
        'members:write',
        'messages:send',
        'workspaces:read',
      ],
    }),
    nextCookies(),
  ],
});

export type Session = any;
export type User = any;
