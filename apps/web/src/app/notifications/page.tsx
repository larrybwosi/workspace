'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, Trash2, Bell, AtSign, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useRespondToFriendRequest,
} from '@repo/api-client';
import { Sidebar } from '@/components/layout/sidebar';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@repo/ui/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications(filter === 'unread');
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();
  const respondToFriendRequestMutation = useRespondToFriendRequest();
  const { toast } = useToast();

  const groupedNotifications = useMemo(() => {
    if (!notifications) return {};

    return notifications.reduce((groups: any, notification: any) => {
      const date = new Date(notification.createdAt);
      let label = '';

      if (isToday(date)) label = 'Today';
      else if (isYesterday(date)) label = 'Yesterday';
      else label = format(date, 'MMMM d, yyyy');

      if (!groups[label]) groups[label] = [];
      groups[label].push(notification);
      return groups;
    }, {});
  }, [notifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast({ title: 'All notifications marked as read' });
    } catch (error) {
      toast({ title: 'Failed to mark all as read', variant: 'destructive' });
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch (error) {
      toast({ title: 'Failed to mark as read', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Notification deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete notification', variant: 'destructive' });
    }
  };

  const handleFriendRequestAction = async (requestId?: string, action?: 'accept' | 'decline') => {
    if (!requestId || !action) return;
    try {
      await respondToFriendRequestMutation.mutateAsync({ requestId, action });
      toast({
        title: action === 'accept' ? 'Friend request accepted' : 'Friend request declined',
      });
    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || 'Failed to process friend request',
        variant: 'destructive',
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign className="h-4 w-4 text-blue-500" />;
      case 'channel_alert':
        return <Bell className="h-4 w-4 text-amber-500" />;
      case 'workspace_invitation':
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'system':
        return <Info className="h-4 w-4 text-slate-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const emptyCopy =
    filter === 'unread'
      ? { title: "You're all caught up", subtitle: 'No unread notifications right now.' }
      : { title: 'No notifications yet', subtitle: "We'll let you know when something happens." };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel="notifications"
        onChannelSelect={() => {}}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DynamicHeader activeView="Notifications" onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />
        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground text-lg">Stay updated with your latest activity</p>
              </div>
              <Button
                variant="outline"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending || !notifications?.some((n: any) => !n.isRead)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="space-y-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="all" className="px-6">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="px-6">
                  Unread
                </TabsTrigger>
              </TabsList>

              <TabsContent value={filter} className="space-y-8">
                {isLoading ? (
                  <NotificationsSkeleton />
                ) : !notifications || notifications.length === 0 ? (
                  <Card className="border-dashed py-12">
                    <CardContent className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                        <Bell className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-medium">{emptyCopy.title}</p>
                        <p className="text-muted-foreground">{emptyCopy.subtitle}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(groupedNotifications).map(([label, group]: [string, any]) => (
                    <div key={label} className="space-y-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                        {label}
                      </h2>
                      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                              <TableHead className="w-10 text-center">Status</TableHead>
                              <TableHead className="w-10"></TableHead>
                              <TableHead>Notification</TableHead>
                              <TableHead className="w-28 text-right">Time</TableHead>
                              <TableHead className="w-48 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.map((notification: any) => {
                              const isFriendRequest =
                                notification.type === 'friend_request' ||
                                notification.entityType === 'friend_request';
                              const requestId =
                                notification.entityId || (notification.metadata as any)?.requestId;

                              return (
                                <TableRow
                                  key={notification.id}
                                  className={cn(
                                    'group transition-colors',
                                    !notification.isRead
                                      ? 'bg-primary/5 hover:bg-primary/10'
                                      : 'hover:bg-muted/50'
                                  )}
                                >
                                  <TableCell className="text-center py-3">
                                    {!notification.isRead ? (
                                      <span
                                        className="inline-block h-2 w-2 rounded-full bg-primary"
                                        title="Unread"
                                      />
                                    ) : (
                                      <span className="inline-block h-2 w-2 rounded-full bg-transparent" />
                                    )}
                                  </TableCell>
                                  <TableCell className="py-3 px-0">
                                    <div
                                      className={cn(
                                        'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                                        !notification.isRead ? 'bg-primary/10' : 'bg-muted'
                                      )}
                                    >
                                      {getIcon(notification.type)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <Link
                                        href={`/notifications/${notification.id}`}
                                        className={cn(
                                          'font-semibold text-sm hover:underline truncate',
                                          !notification.isRead
                                            ? 'text-foreground'
                                            : 'text-muted-foreground'
                                        )}
                                      >
                                        {notification.title}
                                      </Link>
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {notification.message}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap py-3">
                                    {format(new Date(notification.createdAt), 'h:mm a')}
                                  </TableCell>
                                  <TableCell className="text-right py-3">
                                    <div className="flex items-center justify-end gap-1">
                                      {isFriendRequest && (
                                        <div className="flex items-center gap-1 mr-1">
                                          <Button
                                            size="sm"
                                            className="h-7 px-2.5 text-xs"
                                            onClick={() =>
                                              handleFriendRequestAction(requestId, 'accept')
                                            }
                                            disabled={respondToFriendRequestMutation.isPending}
                                          >
                                            Accept
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2.5 text-xs"
                                            onClick={() =>
                                              handleFriendRequestAction(requestId, 'decline')
                                            }
                                            disabled={respondToFriendRequestMutation.isPending}
                                          >
                                            Decline
                                          </Button>
                                        </div>
                                      )}
                                      {notification.type === 'workspace_invitation' && (
                                        <div className="flex items-center gap-1 mr-1">
                                          <Button size="sm" className="h-7 px-2.5 text-xs">
                                            Accept
                                          </Button>
                                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                                            Decline
                                          </Button>
                                        </div>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                      >
                                        <Link href={`/notifications/${notification.id}`}>View</Link>
                                      </Button>
                                      {!notification.isRead && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-primary"
                                          onClick={() => handleMarkRead(notification.id)}
                                          title="Mark as read"
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive"
                                        onClick={() => handleDelete(notification.id)}
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, groupIdx) => (
        <div key={groupIdx} className="space-y-3">
          <Skeleton className="h-3.5 w-20" />
          <div className="rounded-lg border bg-card overflow-hidden p-4 space-y-3">
            {Array.from({ length: groupIdx === 0 ? 3 : 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
