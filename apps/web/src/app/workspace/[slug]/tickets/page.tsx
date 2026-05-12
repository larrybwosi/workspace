'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { WorkspaceSidebar, TicketList, ChannelView, useBranding, TicketStatusBadge } from '@repo/ui';
import {
  useWorkspace,
  useSupportTickets,
  useUpdateTicketStatus,
  useAssignTicket,
  useUsers,
  useWorkspaceMembers,
} from '@repo/api-client';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, UserPlus, MoreVertical, XCircle, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function TicketsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const activeTicketId = searchParams.get('id');

  const { data: workspaceData } = useWorkspace(slug);
  const { data: members } = useWorkspaceMembers(slug);
  useBranding(workspaceData?.brandingConfig);

  const activeAgents = useMemo(
    () => members?.filter((m: any) => ['owner', 'admin', 'moderator'].includes(m.role)),
    [members]
  );

  const { data: tickets } = useSupportTickets(workspaceData?.id || '');
  const updateStatusMutation = useUpdateTicketStatus();
  const assignTicketMutation = useAssignTicket();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeTicket = useMemo(() => tickets?.find((t: any) => t.id === activeTicketId), [tickets, activeTicketId]);

  const handleTicketSelect = (id: string) => {
    router.push(`/workspace/${slug}/tickets?id=${id}`);
  };

  const handleStatusChange = (status: string) => {
    if (!activeTicketId) return;
    updateStatusMutation.mutate(
      { ticketId: activeTicketId, status },
      {
        onSuccess: () => toast.success(`Ticket marked as ${status.toLowerCase()}`),
        onError: () => toast.error('Failed to update ticket status'),
      }
    );
  };

  const handleAssign = (assigneeId: string | null) => {
    if (!activeTicketId) return;
    assignTicketMutation.mutate(
      { ticketId: activeTicketId, assigneeId },
      {
        onSuccess: () => toast.success(assigneeId ? 'Ticket assigned' : 'Ticket unassigned'),
        onError: () => toast.error('Failed to assign ticket'),
      }
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentWorkspaceId={workspaceData?.id}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DynamicHeader activeView="Support Tickets" onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />

        <div className="flex flex-1 overflow-hidden">
          {/* Ticket Sidebar */}
          <div className="w-80 flex-shrink-0 border-r border-border/50">
            <TicketList
              workspaceId={workspaceData?.id || ''}
              onTicketSelect={handleTicketSelect}
              activeTicketId={activeTicketId || undefined}
            />
          </div>

          {/* Ticket Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted/5">
            {activeTicket ? (
              <>
                {/* Ticket Header/Toolbar */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-background/50 backdrop-blur-md z-10">
                  <div className="flex items-center gap-4 min-w-0">
                    <h2 className="font-bold text-lg truncate">{activeTicket.subject}</h2>
                    <TicketStatusBadge status={activeTicket.status} />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold border-border/50">
                          Status
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem onClick={() => handleStatusChange('OPEN')} className="font-medium">
                          <Clock className="mr-2 h-4 w-4 text-blue-500" /> Mark as Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange('IN_PROGRESS')} className="font-medium">
                          <CheckCircle2 className="mr-2 h-4 w-4 text-yellow-500" /> Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange('RESOLVED')} className="font-medium">
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Resolve Ticket
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusChange('CLOSED')}
                          className="font-medium text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Close Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Assignee Selection - In a real app we'd fetch workspace members */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold border-border/50">
                          {activeTicket.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={activeTicket.assignee.avatar} />
                                <AvatarFallback className="text-[8px] font-bold">
                                  {activeTicket.assignee.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {activeTicket.assignee.name.split(' ')[0]}
                            </div>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl">
                        <DropdownMenuLabel>Assign Agent</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* Here you would ideally map through workspace agents */}
                        <DropdownMenuItem
                          onClick={() => handleAssign(null)}
                          className="text-muted-foreground italic font-medium"
                        >
                          Unassign
                        </DropdownMenuItem>
                        {activeAgents?.map((member: any) => (
                          <DropdownMenuItem
                            key={member.userId}
                            onClick={() => handleAssign(member.userId)}
                            className="font-medium"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={member.user.avatar} />
                                <AvatarFallback className="text-[8px] font-bold">
                                  {member.user.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {member.user.name}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-4 bg-border/50 mx-1" />

                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-xl">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Ticket Chat View */}
                <div className="flex-1 overflow-hidden">
                  <ChannelView channelId={activeTicket.channelId} workspaceId={slug} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                <div className="h-20 w-20 bg-muted rounded-3xl mb-6 flex items-center justify-center text-4xl shadow-inner">
                  🎫
                </div>
                <h3 className="text-xl font-bold">Select a ticket</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                  Choose a support ticket from the list to view its history and reply to the customer.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
