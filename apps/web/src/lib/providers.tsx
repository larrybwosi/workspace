'use client';
import type React from 'react';
import { Providers as UIProviders } from '@repo/ui';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <UIProviders>{children}</UIProviders>;
}
