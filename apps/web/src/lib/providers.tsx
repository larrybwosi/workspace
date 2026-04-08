"use client";
import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@repo/ui/layout/theme-provider";
import dynamic from "next/dynamic";
import { NotificationListener } from "@repo/ui/features/notifications/notification-listener";
import { PresenceProvider } from "./contexts/presence-context";
import { useSession } from "./auth/auth-client";

const CallContainer = dynamic(
  () => import("@repo/ui/features/calls/call-container").then((mod) => mod.CallContainer),
  { ssr: false }
);

const AgoraClientProvider = dynamic(
  () => import("@repo/ui/features/calls/agora-provider").then((mod) => mod.AgoraClientProvider),
  { ssr: false }
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 12, // 12 hours
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

import { Providers as UIProviders } from "@repo/ui";

export function Providers({ children }: ProvidersProps) {
  return (
    <UIProviders>
      {children}
    </UIProviders>
  );
}
