'use client';

import {
  X,
  User as UserIcon,
  Calendar,
  Tag,
  CheckSquare,
  TrendingUp,
  Plus,
  Hash,
  MessageCircle,
  FileText,
  LinkIcon,
  Target,
  Clock,
  Phone,
  Video,
  UserPlus,
  Search,
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { mockThread, mockUsers } from '../lib/mock-data';
import { cn } from '../lib/utils';
import React from 'react';
import { MessageSearchPanel } from '../features/chat/message-search-panel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

import { useWorkspace, useWorkspaceMembers } from '@repo/api-client';
import { useChannel } from '@repo/api-client';
import { useParams } from 'next/navigation';
import { useCallStore } from '@repo/shared';
import { toast } from 'sonner';
import { User, Channel, WorkspaceMember } from '../lib/types';
import { ScheduleCallDialog } from '../features/calls/schedule-call-dialog';
import { format } from 'date-fns';

interface InfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dmUser?: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    status: string;
  };
  type?: 'channel' | 'workspace';
  id?: string;
}

export function InfoPanel({ isOpen, onClose, dmUser, type = 'channel', id }: InfoPanelProps) {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const channelSlug = params.channelSlug as string;
  const channelId = id || channelSlug;

  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace(workspaceSlug);
  const { data: channel, isLoading: isChannelLoading } = useChannel(channelId, workspace?.id);
  const { data: workspaceMembers, isLoading: isMembersLoading } = useWorkspaceMembers(workspace?.id);

  const isDM = channelId?.startsWith('dm-') || !!dmUser;
  const members: WorkspaceMember[] = isDM ? [] : (workspaceMembers as any)?.members || [];
  const [activeTab, setActiveTab] = React.useState('info');

  const { setCall, activeCall: currentActiveCall } = useCallStore();
  const [activeCalls, setActiveCalls] = React.useState<any[]>([]);
  const [scheduledCalls, setScheduledCalls] = React.useState<any[]>([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!workspace?.id || !isOpen) return;

    const fetchActiveCalls = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspace.id}/calls/active`);
        if (response.ok) {
          const data = await response.json();
          setActiveCalls(data.calls || []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    const fetchScheduledCalls = async () => {
      try {
        const response = await fetch(`/api/calls/scheduled?workspaceId=${workspace.id}`);
        if (response.ok) {
          const data = await response.json();
          setScheduledCalls(data || []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchActiveCalls();
    fetchScheduledCalls();
    const interval = setInterval(() => {
      fetchActiveCalls();
      fetchScheduledCalls();
    }, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [workspace?.id, isOpen]);

  const handleJoinCall = async (call: any) => {
    if (currentActiveCall) {
      toast.error('You are already in a call');
      return;
    }

    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: call.type,
          callId: call.id,
          workspaceId: workspace?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to join call');
      const data = await response.json();
      setCall(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to join call');
    }
  };

  const handleStartCall = async (callType: 'voice' | 'video', notifyAll?: boolean) => {
    if (!workspace?.id) return;

    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: callType,
          workspaceId: workspace.id,
          channelId: type === 'channel' ? id || channelSlug : undefined,
          recipientId: dmUser?.id,
          notifyAll,
        }),
      });

      if (!response.ok) throw new Error('Failed to start call');
      const data = await response.json();
      setCall(data);
      toast.success(`Starting ${callType} call...`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to start call');
    }
  };

  const [inviteLink, setInviteLink] = React.useState<string>('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateInviteLink = async () => {
    if (!workspace?.id) return;
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/invite-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to generate invite link');
      const data = await response.json();
      const fullLink = `${window.location.origin}/invite/${data.code}`;
      setInviteLink(fullLink);
      navigator.clipboard.writeText(fullLink);
      toast.success('Invite link copied to clipboard!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate invite link');
    } finally {
      setIsGenerating(false);
    }
  };

  if (dmUser) {
    return (
      <>
        {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

        <aside
          className={cn(
            'fixed lg:absolute right-0 top-0 bottom-0 z-50 w-80 bg-card border-l border-border flex flex-col transition-transform duration-200 lg:translate-x-0',
            isOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
            <h2 className="font-semibold">Direct Message</h2>
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* DM User Profile */}
              <div className="flex flex-col items-center text-center space-y-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={dmUser.avatar} alt={dmUser.name} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {dmUser.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{dmUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{dmUser.role}</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'mt-2',
                      dmUser.status === 'online' && 'bg-green-500/10 text-green-600',
                      dmUser.status === 'away' && 'bg-yellow-500/10 text-yellow-600',
                      dmUser.status === 'offline' && 'bg-gray-500/10 text-gray-600'
                    )}
                  >
                    {dmUser.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="sm"
                  onClick={() => handleStartCall('voice')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Start Call
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="sm"
                  onClick={() => handleStartCall('video')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Start Video Call
                </Button>
                {/* </CHANGE> */}
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </div>

              <Separator />

              {/* Shared Files */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold mb-2">Shared Files</h3>
                <p className="text-sm text-muted-foreground">No files shared yet</p>
              </div>

              <Separator />

              {/* Conversation Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Conversation Info</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Messages</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      </>
    );
  }

  // Regular channel/project info panel
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Info Panel */}
      <aside
        className={cn(
          'fixed lg:absolute right-0 top-0 bottom-0 z-50 w-80 bg-card border-l border-border flex flex-col transition-transform duration-200 lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'info' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab('info')}
            >
              Info
            </Button>
            <Button
              variant={activeTab === 'search' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab('search')}
            >
              Search
            </Button>
            <Button
              variant={activeTab === 'activity' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </Button>
            <Button
              variant={activeTab === 'files' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab('files')}
            >
              Files
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {activeTab === 'search' ? (
          <MessageSearchPanel
            channelId={mockThread.channelId}
            onMessageClick={(messageId, channelId) => {
              window.location.href = `/channels/${channelId}?messageId=${messageId}`;
            }}
          />
        ) : (
          <ScrollArea className="flex-1">
            {activeTab === 'info' && (
              <div className="p-4 space-y-6">
                {/* Main Info */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Main info</h3>
                    {type === 'channel' && !isDM && (
                      <div className="flex gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStartCall('voice')}>Notify channel</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartCall('voice', true)}>
                              Notify all members
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Video className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStartCall('video')}>Notify channel</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartCall('video', true)}>
                              Notify all members
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 mb-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-9 text-xs"
                      onClick={() => setIsScheduleDialogOpen(true)}
                    >
                      <Calendar className="h-3.5 w-3.5 mr-2" />
                      Schedule a Call
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                        <span>{type === 'workspace' ? 'Owner' : 'Creator'}</span>
                      </div>
                      <span className="font-medium">
                        {type === 'workspace' ? (
                          isWorkspaceLoading ? (
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                          ) : (
                            workspace?.owner?.name || 'Unknown'
                          )
                        ) : isChannelLoading ? (
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        ) : (
                          channel?.createdBy?.name || 'Unknown'
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Date of creation</span>
                      </div>
                      <span className="font-medium">
                        {type === 'workspace' ? (
                          isWorkspaceLoading ? (
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                          ) : workspace?.createdAt ? (
                            new Date(workspace.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          ) : (
                            'Unknown'
                          )
                        ) : isChannelLoading ? (
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        ) : channel?.createdAt ? (
                          new Date(channel.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        ) : (
                          'Unknown'
                        )}
                      </span>
                    </div>

                    {type === 'workspace' && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Target className="h-4 w-4" />
                          <span>Plan</span>
                        </div>
                        {isWorkspaceLoading ? (
                          <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                        ) : (
                          <Badge variant="secondary" className="capitalize">
                            {workspace?.plan}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>

                {(type === 'workspace' || !!workspace) && (
                  <>
                    <Separator />

                    {/* Active Calls Section */}
                    {activeCalls.length > 0 && (
                      <>
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            Active Calls ({activeCalls.length})
                          </h3>
                          <div className="space-y-2">
                            {activeCalls.map(call => (
                              <div
                                key={call.id}
                                className="p-3 bg-muted/40 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-primary/10 p-1.5 rounded-md">
                                      {call.type === 'video' ? (
                                        <Video className="h-3.5 w-3.5 text-primary" />
                                      ) : (
                                        <Phone className="h-3.5 w-3.5 text-primary" />
                                      )}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                      {call.type} Call
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                                    {call.participants?.length || 0} in call
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={call.initiator?.avatar || call.initiator?.image} />
                                    <AvatarFallback className="text-[8px]">
                                      {call.initiator?.name?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium truncate">
                                    Started by {call.initiator?.name}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  className="w-full h-8 text-xs font-bold"
                                  onClick={() => handleJoinCall(call)}
                                >
                                  Join Call
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Scheduled Calls Section */}
                    {scheduledCalls.length > 0 && (
                      <>
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            Upcoming Calls ({scheduledCalls.length})
                          </h3>
                          <div className="space-y-2">
                            {scheduledCalls.map(call => (
                              <div key={call.id} className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold truncate pr-2">{call.title}</span>
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">
                                    {call.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(call.scheduledFor), 'MMM d, h:mm a')}
                                </div>
                                {call.description && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2 italic">
                                    {call.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={call.initiator?.avatar || call.initiator?.image} />
                                    <AvatarFallback className="text-[6px]">
                                      {call.initiator?.name?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[10px] text-muted-foreground truncate">
                                    By {call.initiator?.name}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Invite to Workspace</h3>
                      <p className="text-xs text-muted-foreground">
                        Generate a unique link to invite others to this workspace.
                      </p>
                      {inviteLink ? (
                        <div className="flex gap-2">
                          <div className="flex-1 px-2 py-1.5 bg-muted rounded text-xs truncate font-mono">
                            {inviteLink}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(inviteLink);
                              toast.success('Copied!');
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full justify-start h-8 text-xs"
                          onClick={handleGenerateInviteLink}
                          disabled={isGenerating}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-2" />
                          {isGenerating ? 'Generating...' : 'Generate Invite Link'}
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {type === 'channel' && (isChannelLoading || channel?.description) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Description</h3>
                      {isChannelLoading ? (
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted animate-pulse rounded" />
                          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{(channel as any)?.description}</p>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Linked Threads */}
                {channel?.threads && channel.threads.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Linked threads</h3>
                      <div className="space-y-2">
                        {channel.threads.map((thread, idx) => (
                          <Button key={idx} variant="ghost" className="w-full justify-start text-sm h-auto py-2">
                            <Hash className="h-3 w-3 mr-2 shrink-0" />
                            <span className="truncate">{thread.title || `Thread ${thread.id.slice(0, 8)}`}</span>
                            {thread._count && thread._count.messages > 0 && (
                              <Badge variant="secondary" className="ml-auto">
                                {thread._count.messages}
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Thread Activity */}
                {type === 'channel' && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Thread activity</h3>
                    <div className="flex items-center gap-1 h-8">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-sm',
                            i % 5 === 0 ? 'bg-green-500' : i % 3 === 0 ? 'bg-green-400' : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Members */}
                {!isDM && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Members</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {isMembersLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2 py-1">
                              <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                              </div>
                              <div className="h-5 w-14 rounded-full bg-muted animate-pulse shrink-0" />
                            </div>
                          ))
                        : members.map((m: any) => {
                            const member = m.user || m;
                            return (
                              <div key={member.id} className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatar || member.image} />
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {member.name?.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.status === 'online' ? 'Online' : 'Offline'}
                                  </p>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'text-xs',
                                    m.role === 'admin' &&
                                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                                    m.role === 'member' &&
                                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                  )}
                                >
                                  {m.role || member.role}
                                </Badge>
                              </div>
                            );
                          })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity tab */}
            {activeTab === 'activity' && (
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground italic">Activity log coming soon...</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-3">Engagement Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Messages</span>
                      <span className="text-sm font-semibold">{channel?._count?.messages || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Threads</span>
                      <span className="text-sm font-semibold">{channel?._count?.threads || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Members</span>
                      <span className="text-sm font-semibold">{channel?._count?.members || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Files tab */}
            {activeTab === 'files' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Shared Files</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground italic">No files found in this channel.</p>
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </aside>

      {workspace?.id && (
        <ScheduleCallDialog
          open={isScheduleDialogOpen}
          onOpenChange={setIsScheduleDialogOpen}
          workspaceId={workspace.id}
          channelId={type === 'channel' ? id || channelSlug : undefined}
        />
      )}
    </>
  );
}
