'use client';

import * as React from 'react';
import { CommandPalette } from './command-palette';

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | undefined>(undefined);

interface CommandPaletteProviderProps {
  children: React.ReactNode;
  workspaceSlug?: string;
  workspaceName?: string;
}

/**
 * Provides global command-palette state plus the Cmd/Ctrl+K shortcut.
 * Wrap workspace-scoped UI so the header search box and keyboard shortcut
 * both open the same palette.
 */
export function CommandPaletteProvider({ children, workspaceSlug, workspaceName }: CommandPaletteProviderProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = React.useMemo(
    () => ({ open, setOpen, toggle: () => setOpen(prev => !prev) }),
    [open]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        workspaceSlug={workspaceSlug}
        workspaceName={workspaceName}
      />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) {
    // Graceful no-op outside a provider so components don't crash.
    return { open: false, setOpen: () => {}, toggle: () => {} } as CommandPaletteContextValue;
  }
  return ctx;
}
