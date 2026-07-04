'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  Hash,
  Lock,
  FileText,
  MessageSquare,
  Clock,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Command as CommandIcon,
  X,
  Loader2,
} from 'lucide-react';

import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../components/avatar';
import { useWorkspaceSearch, type WorkspaceSearchType } from '@repo/api-client';
import { useRecentSearches } from '../hooks/use-recent-searches';

type Tab = { id: WorkspaceSearchType; label: string };

const TABS: Tab[] = [
  { id: 'all', label: 'All results' },
  { id: 'messages', label: 'Messages' },
  { id: 'members', label: 'Members' },
  { id: 'files', label: 'Files' },
  { id: 'channels', label: 'Channels' },
];

function useDebounced<T>(value: T, delay = 200) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function groupByDay(entries: { at: number }[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const groups = { Today: [] as any[], Yesterday: [] as any[], Earlier: [] as any[] };
  for (const e of entries as any[]) {
    if (e.at >= startOfToday) groups.Today.push(e);
    else if (e.at >= startOfYesterday) groups.Yesterday.push(e);
    else groups.Earlier.push(e);
  }
  return groups;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug?: string;
  workspaceName?: string;
}

export function CommandPalette({ open, onOpenChange, workspaceSlug, workspaceName }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [tab, setTab] = React.useState<WorkspaceSearchType>('all');
  const debouncedQuery = useDebounced(query, 200);
  const { entries: recent, add: addRecent, remove: removeRecent, clear: clearRecent } = useRecentSearches(
    workspaceSlug ?? 'global'
  );

  const { data, isFetching } = useWorkspaceSearch(workspaceSlug, debouncedQuery, {
    type: tab,
    limit: 8,
  });

  // Reset transient state whenever the palette is (re)opened.
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setTab('all');
    }
  }, [open]);

  const results = data ?? { channels: [], members: [], messages: [], files: [] };
  const counts = {
    all:
      results.channels.length + results.members.length + results.messages.length + results.files.length,
    messages: results.messages.length,
    members: results.members.length,
    files: results.files.length,
    channels: results.channels.length,
  };

  const navigate = React.useCallback(
    (href: string, recentEntry: Parameters<typeof addRecent>[0]) => {
      addRecent(recentEntry);
      onOpenChange(false);
      router.push(href);
    },
    [addRecent, onOpenChange, router]
  );

  const channelHref = (slugOrId: string | null, id: string) =>
    `/workspace/${workspaceSlug}/channels/${slugOrId ?? id}`;

  const hasQuery = debouncedQuery.trim().length > 0;
  const showTab = (t: WorkspaceSearchType) => tab === 'all' || tab === t;

  const recentGroups = React.useMemo(() => groupByDay(recent), [recent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl overflow-hidden gap-0 p-0 top-[12%] translate-y-0 sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">Search {workspaceName ?? 'workspace'}</DialogTitle>
        <DialogDescription className="sr-only">
          Search across messages, channels, members, and files.
        </DialogDescription>

        <Command shouldFilter={false} className="flex flex-col bg-popover">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 h-14">
            <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={`Search in ${workspaceName ?? 'workspace'}...`}
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border px-3 py-2">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                  tab === t.id
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                {t.label}
                {hasQuery && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[11px] tabular-nums',
                      tab === t.id ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {counts[t.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Command.List className="max-h-[52vh] overflow-y-auto overflow-x-hidden p-2">
            {/* Recent searches (empty query state) */}
            {!hasQuery && (
              <div className="pb-1">
                {recent.length === 0 ? (
                  <div className="px-3 py-10 text-center">
                    <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Search for messages, channels, people, and files.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-2 pb-1">
                      <span className="text-xs font-semibold text-muted-foreground">Recent searches</span>
                      <button
                        type="button"
                        onClick={clearRecent}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Clear
                      </button>
                    </div>
                    {(['Today', 'Yesterday', 'Earlier'] as const).map(day =>
                      recentGroups[day].length ? (
                        <Command.Group
                          key={day}
                          heading={day}
                          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                        >
                          {recentGroups[day].map((entry: any) => (
                            <Command.Item
                              key={entry.id}
                              value={`recent-${entry.id}`}
                              onSelect={() => {
                                if (entry.href) {
                                  navigate(entry.href, entry);
                                } else {
                                  setQuery(entry.label);
                                }
                              }}
                              className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent"
                            >
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 truncate">{entry.label}</span>
                              {entry.meta && (
                                <span className="truncate text-xs text-muted-foreground">{entry.meta}</span>
                              )}
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  removeRecent(entry.id);
                                }}
                                className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-data-[selected=true]:opacity-100"
                                aria-label="Remove"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Command.Item>
                          ))}
                        </Command.Group>
                      ) : null
                    )}
                  </>
                )}
              </div>
            )}

            {/* Live results */}
            {hasQuery && (
              <>
                {counts.all === 0 && !isFetching && (
                  <div className="px-3 py-12 text-center">
                    <p className="text-sm font-medium">No results for &ldquo;{debouncedQuery}&rdquo;</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try a different term or filter.</p>
                  </div>
                )}

                {showTab('channels') && results.channels.length > 0 && (
                  <Command.Group
                    heading="Channels"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {results.channels.map(c => (
                      <Command.Item
                        key={c.id}
                        value={`channel-${c.id}`}
                        onSelect={() =>
                          navigate(channelHref(c.slug, c.id), {
                            id: `channel:${c.id}`,
                            kind: 'channel',
                            label: c.name,
                            meta: 'Channel',
                            href: channelHref(c.slug, c.id),
                          })
                        }
                        className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          {c.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                        </span>
                        <span className="flex-1 truncate font-medium">{c.name}</span>
                        {c.description && (
                          <span className="truncate text-xs text-muted-foreground">{c.description}</span>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {showTab('members') && results.members.length > 0 && (
                  <Command.Group
                    heading="Members"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {results.members.map(m => (
                      <Command.Item
                        key={m.id}
                        value={`member-${m.id}`}
                        onSelect={() =>
                          navigate(`/workspace/${workspaceSlug}/members?member=${m.id}`, {
                            id: `member:${m.id}`,
                            kind: 'member',
                            label: m.name ?? m.email,
                            meta: m.role ?? 'Member',
                            href: `/workspace/${workspaceSlug}/members?member=${m.id}`,
                          })
                        }
                        className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent"
                      >
                        <Avatar className="h-7 w-7">
                          {m.avatar && <AvatarImage src={m.avatar} alt={m.name ?? m.email} />}
                          <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                            {initials(m.name ?? m.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate font-medium">{m.name ?? m.email}</span>
                        {m.role && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
                            {m.role}
                          </span>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {showTab('messages') && results.messages.length > 0 && (
                  <Command.Group
                    heading="Messages"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {results.messages.map(msg => (
                      <Command.Item
                        key={msg.id}
                        value={`message-${msg.id}`}
                        onSelect={() =>
                          navigate(channelHref(msg.channel.slug, msg.channelId), {
                            id: `message:${msg.id}`,
                            kind: 'message',
                            label: msg.content.slice(0, 60),
                            meta: `#${msg.channel.name}`,
                            href: channelHref(msg.channel.slug, msg.channelId),
                          })
                        }
                        className="flex items-start gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent"
                      >
                        <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{msg.content}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {msg.user.name ?? 'Unknown'} in #{msg.channel.name}
                          </p>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {showTab('files') && results.files.length > 0 && (
                  <Command.Group
                    heading="Files"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {results.files.map(f => (
                      <Command.Item
                        key={f.id}
                        value={`file-${f.id}`}
                        onSelect={() => {
                          const href = f.message
                            ? channelHref(f.message.channel.slug, f.message.channelId)
                            : undefined;
                          if (href) {
                            navigate(href, {
                              id: `file:${f.id}`,
                              kind: 'file',
                              label: f.name,
                              meta: f.message ? `#${f.message.channel.name}` : undefined,
                              href,
                            });
                          }
                        }}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 truncate font-medium">{f.name}</span>
                        <span className="text-[11px] uppercase text-muted-foreground">
                          {f.name.split('.').pop()}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </>
            )}
          </Command.List>

          {/* Footer with keyboard hints */}
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="flex h-5 items-center rounded border border-border bg-background px-1">
                  <ArrowUp className="h-3 w-3" />
                </kbd>
                <kbd className="flex h-5 items-center rounded border border-border bg-background px-1">
                  <ArrowDown className="h-3 w-3" />
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="flex h-5 items-center rounded border border-border bg-background px-1">
                  <CornerDownLeft className="h-3 w-3" />
                </kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1">
                <CommandIcon className="h-3 w-3" />K
              </kbd>
              to toggle
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
