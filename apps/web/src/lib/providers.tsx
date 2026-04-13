'use client';
import type React from 'react';
import { WebProviders } from '@repo/ui';
// import { usePushNotifications } from "@/hooks/use-push-notifications";
import dynamic from 'next/dynamic';
import { useSession } from '@repo/shared';

const CallContainer = dynamic(
  () => import('../components/features/calls/call-container').then(mod => mod.CallContainer),
  {
    ssr: false,
  }
);

const AgoraClientProvider = dynamic(
  () => import('../components/features/calls/agora-provider').then(mod => mod.AgoraClientProvider),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
}

function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  // usePushNotifications();
  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  const { data: session } = useSession() as { data: any };
  return (
    <WebProviders>
      <PushNotificationProvider>
        {children}
        {session && (
          <AgoraClientProvider>
            <CallContainer />
          </AgoraClientProvider>
        )}
      </PushNotificationProvider>
    </WebProviders>
  );
}
