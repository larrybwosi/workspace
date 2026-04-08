"use client";
import type React from "react";
import { WebProviders } from "@repo/ui";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WebProviders>
      {children}
    </WebProviders>
  );
}
