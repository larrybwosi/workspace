'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

interface TicketStatusBadgeProps {
  status: string;
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    OPEN: { label: 'Open', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    RESOLVED: { label: 'Resolved', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    CLOSED: { label: 'Closed', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
