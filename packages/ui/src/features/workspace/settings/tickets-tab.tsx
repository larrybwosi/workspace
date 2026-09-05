'use client';

import { useState } from 'react';
import { TicketList } from '../../support/ticket-list';
import { TicketCard } from '../../support/ticket-card';
import { CreateTicketDialog } from '../../support/create-ticket-dialog';
import { useSupportTickets, useUpdateTicketStatus, useAssignTicket } from '@repo/api-client';
import { Button } from '../../../components/button';
import { Plus, Ticket, CheckCircle2, Clock, MessageSquare, User } from 'lucide-react';
import { TicketStatusBadge } from '../../support/ticket-status-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/card';

export function TicketsTab({ workspaceId }: { workspaceId: string }) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: tickets, isLoading } = useSupportTickets(workspaceId);
  const updateStatusMutation = useUpdateTicketStatus();

  const selectedTicket = tickets?.find((t: any) => t.id === selectedTicketId) || tickets?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Support Tickets</h2>
          <p className="text-muted-foreground">Manage and respond to customer support tickets in this workspace</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] border rounded-xl overflow-hidden bg-background">
        <div className="lg:col-span-1 h-full overflow-hidden border-r">
          <TicketList
            workspaceId={workspaceId}
            onTicketSelect={id => setSelectedTicketId(id)}
            activeTicketId={selectedTicket?.id}
          />
        </div>

        <div className="lg:col-span-2 h-full overflow-y-auto p-6 bg-card/50">
          {selectedTicket ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold">{selectedTicket.subject}</h3>
                    <TicketStatusBadge status={selectedTicket.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created by {selectedTicket.customer?.user?.name || 'Customer'} ({selectedTicket.customer?.user?.email})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'RESOLVED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: 'RESOLVED' })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4 text-green-500" />
                      Mark Resolved
                    </Button>
                  )}
                  {selectedTicket.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: 'CLOSED' })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      Close Ticket
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-xs">Assignee</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {selectedTicket.assignee?.name || 'Unassigned'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-xs">Channel</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      {selectedTicket.channel?.name || 'Support Channel'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedTicket.customer?.company && (
                <div className="text-sm bg-muted/40 p-4 rounded-lg">
                  <span className="font-semibold">Company: </span> {selectedTicket.customer.company}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <Ticket className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspaceId={workspaceId}
      />
    </div>
  );
}
