'use client';
import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from '../layout/theme-provider';
import { NotificationListener } from '../features/notifications/notification-listener';
import { PresenceProvider } from './contexts/presence-context';
import { useSession } from '@repo/shared';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Base providers used by all apps (Web, Admin, etc.)
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        gcTime: 1000 * 60 * 60 * 12, // 12 hours
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important so we don't re-make a new client if React
    // suspends during hydration, or there's a duplication of this component
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function BaseProviders({ children }: ProvidersProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          duration={4000}
          expand={true}
          richColors
          closeButton
          theme="system"
          toastOptions={{
            classNames: {
              toast: '!rounded-lg !shadow-lg !border !border-border',
              title: '!font-semibold',
              description: '!text-muted-foreground',
              success:
                '!bg-green-50 !text-green-900 !border-green-200 dark:!bg-green-950 dark:!text-green-50 dark:!border-green-800',
              error: '!bg-red-50 !text-red-900 !border-red-200 dark:!bg-red-950 dark:!text-red-50 dark:!border-red-800',
              warning:
                '!bg-yellow-50 !text-yellow-900 !border-yellow-200 dark:!bg-yellow-950 dark:!text-yellow-50 dark:!border-yellow-800',
              info: '!bg-blue-50 !text-blue-900 !border-blue-200 dark:!bg-blue-950 dark:!text-blue-50 dark:!border-blue-800',
              loading:
                '!bg-gray-50 !text-gray-900 !border-gray-200 dark:!bg-gray-950 dark:!text-gray-50 dark:!border-gray-800',
              actionButton:
                '!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-md !text-sm !font-medium',
              cancelButton:
                '!bg-secondary !text-secondary-foreground hover:!bg-secondary/80 !rounded-md !text-sm !font-medium',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function WebProvidersInner({ children }: ProvidersProps) {
  const { data: session } = useSession() as { data: any };

  return (
    <PresenceProvider userId={session?.user?.id}>
      {children}
      {session && <NotificationListener />}
    </PresenceProvider>
  );
}

/**
 * Providers specific to the Web app
 */
export function WebProviders({ children }: ProvidersProps) {
  return (
    <BaseProviders>
      <WebProvidersInner>{children}</WebProvidersInner>
    </BaseProviders>
  );
}

function AdminProvidersInner({ children }: ProvidersProps) {
  const { data: session } = useSession() as { data: any };

  return (
    <>
      {children}
      {/*{session && <NotificationListener />}*/}
    </>
  );
}

/**
 * Providers specific to the Admin app
 */
export function AdminProviders({ children }: ProvidersProps) {
  return (
    <BaseProviders>
      <AdminProvidersInner>{children}</AdminProvidersInner>
    </BaseProviders>
  );
}

/**
 * Legacy Providers export for backward compatibility
 */
export function Providers({ children }: ProvidersProps) {
  return <WebProviders>{children}</WebProviders>;
}
