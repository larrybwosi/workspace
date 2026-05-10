'use client';

import * as React from 'react';
import { useSupportTickets } from '@repo/api-client';
import { TicketCard } from './ticket-card';
import { Skeleton } from '../../components/skeleton';
import { Search, Inbox } from 'lucide-react';
import { Input } from '../../components/input';

interface TicketListProps {
  workspaceId: string;
  onTicketSelect: (ticketId: string) => void;
  activeTicketId?: string;
}

export function TicketList({ workspaceId, onTicketSelect, activeTicketId }: TicketListProps) {
  const { data: tickets, isLoading } = useSupportTickets(workspaceId);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredTickets = React.useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket: any) =>
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer?.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tickets, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-xl border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/50 border-r border-border/50">
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-9 h-10 bg-muted/30 border-none rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket: any) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isActive={ticket.id === activeTicketId}
              onClick={() => onTicketSelect(ticket.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center space-y-2 opacity-50">
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">No tickets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
