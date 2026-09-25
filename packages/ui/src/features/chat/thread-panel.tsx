'use client';

import {
  X,
  Loader2,
  MessageSquare,
  Bell,
  BellOff,
  CheckCircle2,
  Link,
  Check,
  Maximize2,
  Minimize2,
  Share2,
  MoreVertical,
  CornerDownRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/button';
import { ScrollArea } from '../../components/scroll-area';
import { MessageItem } from './message-item';
import { MessageComposer } from './message-composer';
import { MessageSkeletons } from './components/message-list';
import { useMessages, useSendMessage, useCurrentUser } from '@repo/api-client';
import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { cn, formatMessageTimestamp } from '../../lib/utils';
import { MarkdownRenderer } from '../../shared/markdown-renderer';
import { useRealtimeSubscriptions } from './hooks/use-channel-view';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu';

interface ThreadPanelProps {
  rootMessage: any;
  onClose: () => void;
  workspaceId?: string;
  channelId: string;
  channelName?: string;
}

export function ThreadPanel({
  rootMessage,
  onClose,
  workspaceId,
  channelId,
  channelName,
}: ThreadPanelProps) {
  const threadId = rootMessage.threadId || rootMessage.id;
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  // Panel sizing: 'normal' (380px), 'wide' (540px), 'full' (full-width)
  const [panelSize, setPanelSize] = useState<'normal' | 'wide' | 'full'>('normal');

  // Enterprise features state
  const [isSubscribed, setIsSubscribed] = useState<boolean>(true);
  const [isResolved, setIsResolved] = useState<boolean>(rootMessage.isResolved || false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Subscribe to real-time events for this thread specifically
  useRealtimeSubscriptions(channelId, workspaceId, queryClient, currentUser?.id, threadId);

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    refetch
  } = useMessages(channelId, workspaceId, threadId, undefined, false);

  const sendMessageMutation = useSendMessage(workspaceId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flatMap(page => page.messages);
  }, [messagesData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSendMessage = useCallback(
    (content: string, attachments?: any[]) => {
      sendMessageMutation.mutate({
        channelId,
        content,
        threadId,
        attachments,
        messageType: 'standard',
        mentions: [],
      });
    },
    [channelId, threadId, sendMessageMutation]
  );

  const handleCopyLink = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?messageId=${rootMessage.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [rootMessage.id]);

  const toggleSize = useCallback(() => {
    setPanelSize(prev => {
      if (prev === 'normal') return 'wide';
      if (prev === 'wide') return 'full';
      return 'normal';
    });
  }, []);

  const rootUser = rootMessage.user;
  const rootTimestamp = rootMessage.timestamp
    ? formatMessageTimestamp(rootMessage.timestamp)
    : '';

  const lastReplyTime =
    messages.length > 0
      ? formatDistanceToNow(
          new Date(messages[messages.length - 1]?.timestamp || new Date()),
          { addSuffix: true }
        )
      : null;

  // Collect avatar stack from unique reply authors (max 4)
  const replyAvatars = useMemo(() => {
    const seen = new Set<string>();
    const avatars: { id: string; name: string; avatar: string }[] = [];
    for (const m of messages) {
      const u = m.user;
      if (u && !seen.has(u.id)) {
        seen.add(u.id);
        avatars.push({
          id: u.id,
          name: u.name || 'User',
          avatar: u.avatar || u.image || '',
        });
        if (avatars.length >= 4) break;
      }
    }
    return avatars;
  }, [messages]);

  const panelWidthClass =
    panelSize === 'full'
      ? 'w-full absolute inset-0 z-30'
      : panelSize === 'wide'
      ? 'w-[580px]'
      : 'w-[400px]';

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex flex-col h-full border-l border-border/60 bg-background shadow-xl transition-all duration-200 animate-in slide-in-from-right shrink-0 relative',
          panelWidthClass
        )}
      >
        {/* Enterprise Thread Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border/60 bg-background/95 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-foreground truncate">
                  Thread
                </h3>
                {isResolved && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Resolved
                  </span>
                )}
              </div>
              {channelName && (
                <p className="text-[11px] font-medium text-muted-foreground/80 truncate">
                  #{channelName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Notification Subscription Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSubscribed(prev => !prev)}
                  className={cn(
                    'h-8 w-8 rounded-lg transition-colors',
                    isSubscribed ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'
                  )}
                >
                  {isSubscribed ? (
                    <Bell className="h-4 w-4 fill-primary/20" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isSubscribed ? 'Following thread (Click to mute)' : 'Not following thread (Click to subscribe)'}
              </TooltipContent>
            </Tooltip>

            {/* Expand / Minimize Width */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSize}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {panelSize === 'full' ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {panelSize === 'full' ? 'Restore size' : 'Expand panel'}
              </TooltipContent>
            </Tooltip>

            {/* Context / More Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs">
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                  {copiedLink ? <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" /> : <Link className="mr-2 h-3.5 w-3.5" />}
                  {copiedLink ? 'Link Copied!' : 'Copy Thread Link'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsResolved(prev => !prev)}
                  className="cursor-pointer"
                >
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                  {isResolved ? 'Mark as Unresolved' : 'Mark Thread as Resolved'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thread Content Area */}
        <ScrollArea className="flex-1 bg-background/50">
          <div className="flex flex-col">
            {/* Resolution Banner */}
            {isResolved && (
              <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="font-medium">This thread has been marked as resolved.</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsResolved(false)}
                  className="h-6 text-[11px] px-2 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20"
                >
                  Reopen
                </Button>
              </div>
            )}

            {/* Original / Root Message Card */}
            <div className="p-4 border-b border-border/40 bg-muted/20">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 rounded-full shrink-0 ring-1 ring-border">
                  <AvatarImage
                    src={rootUser?.avatar || rootUser?.image}
                    alt={rootUser?.name}
                  />
                  <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                    {rootUser?.name?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {rootUser?.name || 'Unknown'}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70 shrink-0">
                        {rootTimestamp}
                      </span>
                    </div>
                  </div>

                  <div className="text-[14px] leading-relaxed text-foreground/90">
                    <MarkdownRenderer
                      content={rootMessage.content || ''}
                      className="whitespace-pre-wrap break-words"
                    />
                  </div>

                  {/* Attachments if any */}
                  {rootMessage.attachments && rootMessage.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rootMessage.attachments.map((att: any, idx: number) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border/80 text-xs text-foreground/80 hover:text-primary hover:border-primary/50 transition-colors"
                        >
                          <span className="truncate max-w-[180px] font-medium">
                            {att.name || 'Attachment'}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Reply Metadata Summary */}
                  {messages.length > 0 && (
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/30">
                      <div className="flex -space-x-2">
                        {replyAvatars.map(a => (
                          <Avatar
                            key={a.id}
                            className="h-6 w-6 rounded-full border-2 border-background ring-1 ring-border/50"
                          >
                            <AvatarImage src={a.avatar} alt={a.name} />
                            <AvatarFallback className="text-[9px] font-semibold bg-primary/20 text-primary">
                              {a.name.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="text-foreground font-semibold">
                          {messages.length} {messages.length === 1 ? 'reply' : 'replies'}
                        </span>
                        {lastReplyTime && (
                          <>
                            <span className="text-border">•</span>
                            <span>Last reply {lastReplyTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Replies Section Bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-background/90 backdrop-blur-md border-b border-border/40">
              <div className="flex items-center gap-2">
                <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Replies ({messages.length})
                </span>
              </div>
              {isSubscribed && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                  <Sparkles className="h-3 w-3" />
                  Live updates on
                </span>
              )}
            </div>

            {/* Error state handle */}
            {isError && (
              <div className="p-4 m-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Failed to load thread replies.</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-6 text-xs">
                  Retry
                </Button>
              </div>
            )}

            {/* Replies List */}
            {isLoading && messages.length === 0 ? (
              <div className="px-4 py-2">
                <MessageSkeletons />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground/50 border border-border/40">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">No replies in this thread yet</h4>
                <p className="text-xs text-muted-foreground max-w-[240px] mt-1">
                  Start the conversation by sending a reply below.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/20">
                {messages.map(message => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    channelId={channelId}
                    workspaceId={workspaceId}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Pagination / Older Replies */}
            {hasNextPage && (
              <div className="flex justify-center py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-xs h-8 rounded-xl font-medium"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  ) : null}
                  Load earlier replies
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Enterprise Thread Composer Footer */}
        <div className="p-3 bg-background border-t border-border/60 shrink-0">
          <MessageComposer
            onSend={handleSendMessage}
            placeholder={isResolved ? "Reply to reopened thread..." : "Reply in thread..."}
            channelId={channelId}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
