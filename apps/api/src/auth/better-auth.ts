import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@repo/database';
import { admin, jwt, organization } from 'better-auth/plugins';

export const auth: any = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_API_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt(),
    organization(),
    admin() as any,
  ],
}) as any;
