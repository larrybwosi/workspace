import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/database";
import { jwt, organization, admin } from "better-auth/plugins";

export const auth: any = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt(),
    organization(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    admin() as any,
  ],
});
