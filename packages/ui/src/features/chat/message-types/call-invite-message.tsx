'use client';

import * as React from 'react';
import { Phone, Video, Play, ExternalLink, Clock } from 'lucide-react';
import { Button } from '../../../components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/avatar';
import { Badge } from '../../../components/badge';
import { cn } from '../../../lib/utils';
import { useCallStore } from '@repo/shared';
import { useCall, useJoinCall } from '@repo/api-client';
import { toast } from 'sonner';

interface CallInviteMessageProps {
  message: any;
  attachment: any;
}

export function CallInviteMessage({ message, attachment }: CallInviteMessageProps) {
  const { setCall, activeCall } = useCallStore();
  const callId = message.metadata?.callId || attachment.url.split('/').pop();
  const { data: call, isLoading } = useCall(callId);
  const joinCallMutation = useJoinCall();

  const callType = call?.type || message.metadata?.callType || 'video';
  const workspaceSlug = message.metadata?.workspaceSlug || 'default';

  const handleJoin = async () => {
    if (activeCall) {
      toast.error('You are already in a call');
      return;
    }

    try {
      const data = await joinCallMutation.mutateAsync({
        type: callType,
        callId: callId,
        workspaceSlug: workspaceSlug,
      });
      setCall(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to join call');
    }
  };

  const isEnded = call?.status === 'ended';
  const participants = call?.participants || [];
  const participantCount = participants.length;
  const topAvatars = participants.slice(0, 3);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      className={cn(
        'max-w-sm overflow-hidden border-2 transition-all duration-300',
        isEnded
          ? 'border-border bg-muted/30 opacity-80'
          : 'border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm hover:shadow-md'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg transition-colors', isEnded ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary')}>
            {callType === 'video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              {isEnded ? 'Call Ended' : 'Ongoing Call'}
              {!isEnded && !isLoading && (
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </CardTitle>
            <CardDescription className="text-xs truncate">
              {isEnded
                ? `Duration: ${formatDuration(call?.duration || 0)}`
                : `${message.sender.name} is inviting you to join`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {!isEnded && participantCount > 0 ? (
          <div className="flex flex-col gap-3 bg-background/50 p-3 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Participants ({participantCount})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                {topAvatars.map((p: any) => (
                  <Avatar key={p.user.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={p.user.avatar || p.user.image} />
                    <AvatarFallback className="text-[10px]">
                      {p.user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {participantCount > 3 && (
                <span className="text-xs text-muted-foreground font-medium">
                  +{participantCount - 3} more
                </span>
              )}
              {participantCount > 0 && (
                <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Live
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-background/50 p-3 rounded-lg border border-border">
            <Avatar className="h-10 w-10">
              <AvatarImage src={message.sender.avatar || message.sender.image} />
              <AvatarFallback>{message.sender.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">{message.sender.name}</p>
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider h-5">
                {callType} Call
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
      {!isEnded && (
        <CardFooter className="pt-0">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10 font-bold shadow-sm"
            onClick={handleJoin}
            disabled={joinCallMutation.isPending}
          >
            {joinCallMutation.isPending ? (
              'Joining...'
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Join Call Now
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
