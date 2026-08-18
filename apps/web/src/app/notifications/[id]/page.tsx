'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Bell,
  AtSign,
  UserPlus,
  Info,
  Trash2,
  CheckCircle,
  Clock,
  Calendar,
  Layers,
  Check,
  X,
} from 'lucide-react';
import {
  useNotification,
  useUpdateNotificationReadStatus,
  useDeleteNotification,
  useRespondToFriendRequest,
} from '@repo/api-client';
import { Sidebar } from '@/components/layout/sidebar';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  const { data: notification, isLoading, error } = useNotification(id);
  const updateReadStatusMutation = useUpdateNotificationReadStatus();
  const deleteMutation = useDeleteNotification();
  const respondToFriendRequestMutation = useRespondToFriendRequest();

  const [friendRequestStatus, setFriendRequestStatus] = useState<'accepted' | 'declined' | null>(null);

  const handleToggleReadStatus = async () => {
    if (!notification) return;
    try {
      const nextState = !notification.isRead;
      await updateReadStatusMutation.mutateAsync({
        notificationId: notification.id,
        isRead: nextState,
      });
      toast({
        title: nextState ? 'Marked as read' : 'Marked as unread',
      });
    } catch (err) {
      toast({
        title: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!notification) return;
    try {
      await deleteMutation.mutateAsync(notification.id);
      toast({ title: 'Notification deleted' });
      router.push('/notifications');
    } catch (err) {
      toast({ title: 'Failed to delete notification', variant: 'destructive' });
    }
  };

  const handleFriendRequestAction = async (action: 'accept' | 'decline') => {
    const requestId = notification?.entityId || (notification?.metadata as any)?.requestId;
    if (!requestId) {
      toast({ title: 'Request ID missing', variant: 'destructive' });
      return;
    }

    try {
      await respondToFriendRequestMutation.mutateAsync({ requestId, action });
      setFriendRequestStatus(action === 'accept' ? 'accepted' : 'declined');
      toast({
        title: action === 'accept' ? 'Friend request accepted' : 'Friend request declined',
      });
    } catch (err: any) {
      toast({
        title: err?.response?.data?.message || 'Failed to process friend request',
        variant: 'destructive',
      });
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'mention':
        return <AtSign className="h-6 w-6 text-blue-500" />;
      case 'channel_alert':
        return <Bell className="h-6 w-6 text-amber-500" />;
      case 'workspace_invitation':
      case 'friend_request':
        return <UserPlus className="h-6 w-6 text-green-500" />;
      case 'system':
        return <Info className="h-6 w-6 text-slate-500" />;
      default:
        return <Bell className="h-6 w-6 text-primary" />;
    }
  };

  const isFriendRequest =
    notification?.type === 'friend_request' || notification?.entityType === 'friend_request';

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel="notifications"
        onChannelSelect={() => {}}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DynamicHeader
          activeView="Notification Details"
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
        />
        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/notifications')}
              className="group text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Notifications
            </Button>

            {isLoading ? (
              <NotificationDetailSkeleton />
            ) : error || !notification ? (
              <Card className="border-dashed py-12 text-center">
                <CardContent className="space-y-4">
                  <Bell className="h-10 w-10 text-muted-foreground mx-auto" />
                  <div>
                    <h2 className="text-xl font-bold">Notification Not Found</h2>
                    <p className="text-muted-foreground text-sm">
                      This notification may have been deleted or does not exist.
                    </p>
                  </div>
                  <Button onClick={() => router.push('/notifications')}>Return to Notifications</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl font-bold">{notification.title}</CardTitle>
                          <Badge variant={notification.isRead ? 'secondary' : 'default'}>
                            {notification.isRead ? 'Read' : 'Unread'}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-1 text-xs">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(notification.createdAt), 'PPpp')}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleReadStatus}
                        disabled={updateReadStatusMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                        {notification.isRead ? 'Mark as Unread' : 'Mark as Read'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-2">
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
                      {notification.message}
                    </p>
                  </div>

                  {/* Actions section for friend requests */}
                  {isFriendRequest && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Friend Request</p>
                          <p className="text-xs text-muted-foreground">
                            {(notification.metadata as any)?.senderName
                              ? `${(notification.metadata as any).senderName} wants to connect with you.`
                              : 'You have a pending friend request.'}
                          </p>
                        </div>
                      </div>

                      {friendRequestStatus ? (
                        <Badge
                          variant={friendRequestStatus === 'accepted' ? 'default' : 'secondary'}
                          className="px-3 py-1 text-xs font-semibold"
                        >
                          {friendRequestStatus === 'accepted' ? 'Request Accepted' : 'Request Declined'}
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleFriendRequestAction('accept')}
                            disabled={respondToFriendRequestMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1.5" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFriendRequestAction('decline')}
                            disabled={respondToFriendRequestMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1.5" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {notification.type === 'workspace_invitation' && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <UserPlus className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Workspace Invitation</p>
                        <p className="text-xs text-muted-foreground">
                          You have been invited to join this workspace.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm">Accept Invitation</Button>
                        <Button size="sm" variant="outline">
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Notification Properties
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>Type:</span>
                        <span className="font-medium text-foreground capitalize">
                          {notification.type?.replace('_', ' ') || 'General'}
                        </span>
                      </div>
                      {notification.entityType && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>Entity:</span>
                          <span className="font-medium text-foreground capitalize">
                            {notification.entityType} ({notification.entityId || 'N/A'})
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>Created:</span>
                        <span className="font-medium text-foreground">
                          {format(new Date(notification.createdAt), 'yyyy-MM-dd HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function NotificationDetailSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}
