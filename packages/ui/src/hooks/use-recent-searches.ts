'use client';

import * as React from 'react';

export interface RecentSearchEntry {
  id: string;
  label: string;
  kind: 'query' | 'channel' | 'member' | 'file' | 'message';
  href?: string;
  meta?: string;
  at: number;
}

const MAX_ENTRIES = 12;

function storageKey(scope: string) {
  return `scryme:recent-searches:${scope}`;
}

/**
 * Lightweight, per-workspace recent-search history persisted in localStorage.
 * This is UI convenience state (not application data), mirroring the command
 * palette's "Recent searches" section.
 */
export function useRecentSearches(scope = 'global') {
  const [entries, setEntries] = React.useState<RecentSearchEntry[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(scope));
      if (raw) setEntries(JSON.parse(raw));
      else setEntries([]);
    } catch {
      setEntries([]);
    }
  }, [scope]);

  const persist = React.useCallback(
    (next: RecentSearchEntry[]) => {
      setEntries(next);
      try {
        localStorage.setItem(storageKey(scope), JSON.stringify(next));
      } catch {
        /* ignore quota / privacy-mode errors */
      }
    },
    [scope]
  );

  const add = React.useCallback(
    (entry: Omit<RecentSearchEntry, 'id' | 'at'> & { id?: string }) => {
      const id = entry.id ?? `${entry.kind}:${entry.label}`;
      const next: RecentSearchEntry = { ...entry, id, at: Date.now() };
      setEntries(prev => {
        const deduped = prev.filter(e => e.id !== id);
        const updated = [next, ...deduped].slice(0, MAX_ENTRIES);
        try {
          localStorage.setItem(storageKey(scope), JSON.stringify(updated));
        } catch {
          /* ignore */
        }
        return updated;
      });
    },
    [scope]
  );

  const remove = React.useCallback(
    (id: string) => persist(entries.filter(e => e.id !== id)),
    [entries, persist]
  );

  const clear = React.useCallback(() => persist([]), [persist]);

  return { entries, add, remove, clear };
}
