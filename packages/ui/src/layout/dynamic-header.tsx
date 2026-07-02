'use client';
import { Menu, Search, PanelRight, ChevronLeft, Hash, Lock, ChevronRight } from 'lucide-react';
import { Button } from '../components/button';
import { ThemeToggle } from './theme-toggle';
import { Huddle } from '../features/chat/huddle';
import { useCurrentUser } from '@repo/api-client';
import { useWorkspace, useWorkspaceChannels } from '@repo/api-client';
import { useParams } from 'next/navigation';
import { Skeleton } from '../components/skeleton';
import { useCommandPalette } from './command-palette-provider';

interface DynamicHeaderProps {
  activeView: string;
  onMenuClick: () => void;
  onSearchClick?: () => void;
  onBackClick?: () => void;
  onInfoClick?: () => void;
}

export function DynamicHeader({ activeView, onMenuClick, onSearchClick, onBackClick, onInfoClick }: DynamicHeaderProps) {
  const { data: currentUser } = useCurrentUser();
  const { slug } = useParams();
  const { data: workspace } = useWorkspace(slug as string);
  const { data: channels, isLoading } = useWorkspaceChannels(slug as string);
  const palette = useCommandPalette();

  const openSearch = () => {
    if (onSearchClick) onSearchClick();
    palette.setOpen(true);
  };

  const findChannel = (list: any[], id: string): any => {
    if (!list) return null;
    for (const channel of list) {
      if (channel.id === id || channel.slug === id) return channel;
      if (channel.children) {
        const found = findChannel(channel.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const channel = activeView && !activeView.startsWith('dm-') ? findChannel(channels ?? [], activeView) : null;

  const getBreadcrumb = () => {
    if (isLoading) {
      return <Skeleton className="h-4 w-32" />;
    }

    if (activeView.startsWith('dm-')) {
      return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Direct Messages</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="font-semibold text-foreground">Conversation</span>
        </nav>
      );
    }

    if (channel) {
      return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          {workspace?.name && (
            <>
              <span className="hidden text-muted-foreground sm:inline">{workspace.name}</span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground/60 sm:inline" />
            </>
          )}
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            {channel.isPrivate ? (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {channel.name}
          </span>
        </nav>
      );
    }

    return <span className="text-sm font-semibold">{workspace?.name ?? 'Scrymechat'}</span>;
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
        {onBackClick && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBackClick}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        <div className="flex min-w-0 items-center truncate">{getBreadcrumb()}</div>
      </div>

      <div className="flex items-center gap-1.5">
        {channel && currentUser && (
          <Huddle channelId={channel.id} channelName={channel.name} user={currentUser} onClose={() => {}} />
        )}

        {/* Search trigger (opens command palette) */}
        <button
          type="button"
          onClick={openSearch}
          className="hidden h-8 w-56 items-center gap-2 rounded-lg border border-border bg-secondary/60 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary md:flex"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1 text-[11px] font-medium">
            ⌘K
          </kbd>
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={openSearch}>
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onInfoClick}>
          <PanelRight className="h-4 w-4" />
          <span className="sr-only">Toggle details panel</span>
        </Button>
      </div>
    </header>
  );
}
