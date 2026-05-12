'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, User, Clock, ChevronRight } from 'lucide-react';
import { TicketStatusBadge } from './ticket-status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';
import { cn } from '../../lib/utils';

interface TicketCardProps {
  ticket: any;
  isActive?: boolean;
  onClick: (ticket: any) => void;
}

export function TicketCard({ ticket, isActive, onClick }: TicketCardProps) {
  const customerUser = ticket.customer?.user;
  const assignee = ticket.assignee;

  return (
    <div
      onClick={() => onClick(ticket)}
      className={cn(
        'group p-4 rounded-xl border transition-all cursor-pointer',
        isActive
          ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-sm'
          : 'bg-card border-border/50 hover:border-border hover:bg-muted/30'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'text-sm font-bold truncate group-hover:text-primary transition-colors',
              isActive ? 'text-primary' : 'text-foreground'
            )}
          >
            {ticket.subject}
          </h4>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={customerUser?.avatar} />
          <AvatarFallback className="text-[10px] bg-muted rounded-lg font-bold">
            {customerUser?.name?.slice(0, 2).toUpperCase() || 'CU'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{customerUser?.name || 'Anonymous Customer'}</p>
          <p className="text-[10px] text-muted-foreground truncate">{customerUser?.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(ticket.lastMessageAt), { addSuffix: true })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {assignee ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/30">
              <Avatar className="h-4 w-4 rounded-full">
                <AvatarImage src={assignee.avatar} />
                <AvatarFallback className="text-[6px] font-bold">
                  {assignee.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-bold text-muted-foreground">{assignee.name.split(' ')[0]}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-500/5 border border-yellow-500/10">
              <User className="h-3 w-3 text-yellow-500/60" />
              <span className="text-[10px] font-bold text-yellow-500/60 uppercase tracking-tighter">Unassigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
