import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, jwt, organization } from 'better-auth/plugins';
import { oauthProvider } from '@better-auth/oauth-provider';
import { prisma } from './db/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  plugins: [
    admin({
      defaultRole: 'Member',
    }),
    nextCookies(),
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
  ],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
