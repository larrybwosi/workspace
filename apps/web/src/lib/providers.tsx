"use client";
import type React from "react";
import { WebProviders } from "@repo/ui";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface ProvidersProps {
  children: React.ReactNode;
}

function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  usePushNotifications();
  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WebProviders>
      <PushNotificationProvider>
        {children}
      </PushNotificationProvider>
    </WebProviders>
  );
}
