import { authClient as sharedClient } from '@repo/shared';

export const authClient = sharedClient;

export const { signIn, signOut, signUp, useSession } = authClient;
