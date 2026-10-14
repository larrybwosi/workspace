'use client';

import * as React from 'react';
import { Command, CommandGroup, CommandItem, CommandList } from '../components/command';
import { Avatar, AvatarFallback, AvatarImage } from '../components/avatar';
import { Hash, Users, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export type MentionType = 'user' | 'channel' | 'special';

export interface MentionItem {
  id: string;
  name: string;
  type: MentionType;
  image?: string;
  description?: string;
}

interface MentionSelectorProps {
  items: MentionItem[];
  onSelect: (item: MentionItem) => void;
  searchTerm: string;
  position: { top: number; left: number };
  type: 'user' | 'channel';
}

export function MentionSelector({ items, onSelect, searchTerm, position, type }: MentionSelectorProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const filteredItems = React.useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter(
      item => item.name.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onSelect]);

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute z-50 w-72 bg-popover/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ top: position.top, left: position.left }}
    >
      <Command className="rounded-2xl">
        <CommandList className="max-h-64 p-1">
          <CommandGroup heading={type === 'user' ? 'Members' : 'Channels'} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1 pb-0.5">
            {filteredItems.map((item, index) => (
              <CommandItem
                key={`${item.type}-${item.id}`}
                onSelect={() => onSelect(item)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-xl transition-colors text-sm',
                  index === selectedIndex ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted/60'
                )}
              >
                {item.type === 'user' && (
                  <Avatar className="h-7 w-7 rounded-full overflow-hidden shrink-0">
                    <AvatarImage src={item.image} alt={item.name} />
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {item.name ? item.name.slice(0, 2).toUpperCase() : '??'}
                    </AvatarFallback>
                  </Avatar>
                )}
                {item.type === 'channel' && (
                  <div className="h-7 w-7 rounded-xl bg-muted/80 flex items-center justify-center shrink-0">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                {item.type === 'special' && (
                  <div className="h-7 w-7 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    {item.id === 'all' ? (
                      <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium truncate leading-none">{item.name}</p>
                    {item.type === 'special' && (
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                        Notify
                      </span>
                    )}
                  </div>
                  {item.description && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
