import { authClient } from '@repo/shared/auth/client';

export const useAuth = () => {
  const { data: session, isPending, error } = authClient.useSession();

  return {
    session,
    user: session?.user,
    isLoading: isPending,
    error,
    isAuthenticated: !!session,
  };
};
