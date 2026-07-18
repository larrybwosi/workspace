'use client';

import * as React from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default browser-provided mini-infobar prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((listener) => listener());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach((listener) => listener());
  });
}

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = React.useState(() => !!globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    const handleUpdate = () => {
      setIsInstallable(!!globalDeferredPrompt);
      checkStandalone();
    };

    listeners.add(handleUpdate);
    // Initial sync
    handleUpdate();

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const install = async () => {
    if (!globalDeferredPrompt) {
      return false;
    }
    const promptEvent = globalDeferredPrompt;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      globalDeferredPrompt = null;
      listeners.forEach((listener) => listener());
    }
    return outcome === 'accepted';
  };

  return {
    isInstallable,
    isInstalled,
    install,
  };
}
