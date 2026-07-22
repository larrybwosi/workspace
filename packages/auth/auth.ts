import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@repo/database';
import { admin, bearer, deviceAuthorization, jwt, organization, username } from 'better-auth/plugins';
import { oauthProvider } from '@better-auth/oauth-provider';
import { nextCookies } from 'better-auth/next-js';
import { validateEnv } from '@repo/shared';

const env = validateEnv();

const getBaseURL = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const fallback = isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000';
  const url = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_API_URL || fallback;
  return url.includes('/api/auth') ? url : url.replace(/\/$/, '') + '/api/auth';
};

const getBaseURLConfig = () => {
  return {
    allowedHosts: [
      'localhost:*',
      'scryme.tech',
      'app.scryme.tech',
      'crm.scryme.tech',
      'api.scryme.tech',
      'chat.scryme.tech',
      'api.chat.scryme.tech',
      '*.scryme.tech',
    ],
    protocol: env.NODE_ENV === 'development' ? 'http' : 'https',
    fallback: getBaseURL(),
  };
};

const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((origin: string) => origin.trim()) : [];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: getBaseURLConfig() as any,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET && {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }),
    ...(process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET && {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }),
    ...(process.env.INSTAGRAM_CLIENT_ID &&
      process.env.INSTAGRAM_CLIENT_SECRET && {
        instagram: {
          clientId: process.env.INSTAGRAM_CLIENT_ID,
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
        },
      }),
  },

  trustedOrigins: [
    ...allowedOrigins,
    '*.scryme.tech',
    'https://scryme.tech',
    'https://app.scryme.tech',
    'https://chat.scryme.tech',
    'https://api.chat.scryme.tech',
    'http://localhost:3000',
    'http://localhost:3001',
  ],

  // Only keep fields NOT managed by plugins (like bio)
  user: {
    additionalFields: {
      bio: {
        type: 'string',
        required: false,
      },
    },
  },

  // Re-added 'as any' to fix type errors in CI while maintaining plugin functionality
  plugins: [
    jwt(),
    organization(),
    username(),
    admin({
      defaultRole: 'Member',
    }),
    bearer(),
    deviceAuthorization({ verificationUri: '/device' }),
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
