'use client';

import { Smile, MessageSquare, Copy, Trash2, Edit, LinkIcon, MoreHorizontal, Reply, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';
import { Button } from '../../components/button';
import type { Message } from '../../lib/types';
import { mockUsers } from '../../lib/mock-data';
import { cn, formatTime } from '../../lib/utils';
import { CODE_BLOCK_REGEX, renderCustomMessage, extractCodeInfo } from '../../lib/message-renderer';
import { SyntaxHighlighter } from '../../shared/syntax-highlighter';
import { CustomEmojiPicker } from '../../shared/custom-emoji-picker';
import { MarkdownRenderer } from '../../shared/markdown-renderer';
import { CustomMessage } from './message-types/custom-message';
import { DocumentEmbed } from './message-types/document-embed';
import { MessageAttachments } from './message-types/message-attachments';
import { LinkPreview } from './link-preview';
import { useUsers } from '@repo/api-client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../shared/context-menu';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu';

import { useUpdateMessage, useDeleteMessage, useTriggerAction } from '@repo/api-client';
import { useMemo, useState, memo, useCallback } from 'react';
import { UserBadgeDisplay } from '../social/user-badge-display';
import { format } from 'date-fns';
import { useSession } from '@repo/shared';
import { toast } from 'sonner';

interface MessageItemProps {
  message: any;
  showAvatar?: boolean;
  onReply?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string, isCustom?: boolean, customEmojiId?: string) => void;
  depth?: number;
  isReply?: boolean;
  channelId?: string;
  workspaceId?: string;
  isHighlighted?: boolean;
  highlightRef?: React.RefObject<HTMLDivElement>;
}

// Discord uses a fixed left column of 72px (16px padding + 40px avatar + 16px gap)
const AVATAR_COL_WIDTH = 'w-10'; // 40px
const GAP = 'gap-3'; // 12px → total offset = 16 + 40 + 12 = 68px ≈ Discord's ~72px

/**
 * ⚡ Performance: Memoized to prevent re-renders of the entire message list
 * when parent state changes (e.g. typing indicators, scroll events).
 * Expected impact: Reduces re-renders by >90% in active channels.
 */
interface MessageEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

const MessageEditor = memo(({ initialContent, onSave, onCancel }: MessageEditorProps) => (
  <div className="w-full mt-1">
    <textarea
      defaultValue={initialContent}
      className="text-sm leading-relaxed text-foreground border border-border rounded bg-card p-2 w-full font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
      rows={4}
      autoFocus
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSave((e.target as HTMLTextAreaElement).value);
        }
        if (e.key === 'Escape') onCancel();
      }}
    />
    <p className="text-[11px] text-muted-foreground mt-1">Enter to save · Escape to cancel</p>
  </div>
));

MessageEditor.displayName = 'MessageEditor';

const MessageHeader = memo(({ user, message, userBadges, isReply }: { user: any, message: any, userBadges: any[], isReply: boolean }) => (
  <div className="flex flex-wrap items-baseline gap-x-2 mb-[1px]">
    <span className="font-semibold text-[15px] leading-[22px] cursor-pointer hover:underline text-foreground">
      {user?.name}
    </span>
    {message.metadata?.isBot && (
      <span className="inline-flex items-center px-1 py-0 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider border border-primary/20 leading-none">
        Bot
      </span>
    )}
    {userBadges.length > 0 && <UserBadgeDisplay badges={userBadges} maxDisplay={2} size="sm" />}
    <span className="text-[12px] text-muted-foreground/70 font-normal">
      {format(new Date(message.timestamp || new Date()), 'MM/dd/yyyy HH:mm')}
    </span>
    {isReply && (
      <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
        <Reply className="h-3 w-3" />
        replied to {(message as any).replyToUser?.name || 'someone'}
      </span>
    )}
  </div>
));

MessageHeader.displayName = 'MessageHeader';

const MessageActions = memo(({
  actions,
  messageId,
  triggerActionMutation
}: {
  actions: any[],
  messageId: string,
  triggerActionMutation: any
}) => {
  const variantMap: Record<string, any> = {
    primary: 'default',
    danger: 'destructive',
    destructive: 'destructive',
    default: 'outline',
    outline: 'outline',
    secondary: 'secondary',
    ghost: 'ghost',
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action: any) => {
        const variant = variantMap[action.variant || action.style || ''] || 'outline';
        const isActionLoading = triggerActionMutation.isPending && triggerActionMutation.variables?.actionId === (action.actionId || action.id);

        return (
          <Button
            key={action.id || action.actionId}
            size="sm"
            variant={variant}
            className="h-7 text-xs px-3"
            disabled={triggerActionMutation.isPending}
            onClick={async () => {
              if (action.handler && typeof action.handler === 'function') {
                action.handler(messageId, action.actionId || action.id);
              } else {
                try {
                  await triggerActionMutation.mutateAsync({
                    messageId: messageId,
                    actionId: action.actionId || action.id,
                  });
                  toast.success('Action recorded');
                } catch (err) {
                  toast.error('Failed to record action');
                }
              }
            }}
          >
            {isActionLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
});

MessageActions.displayName = 'MessageActions';

const MessageReactions = memo(({
  reactions,
  messageId,
  handleAddReaction,
  handleToggleReaction
}: {
  reactions: any[],
  messageId: string,
  handleAddReaction: (emoji: string, isCustom?: boolean, customEmojiId?: string) => void,
  handleToggleReaction: (emoji: string) => void
}) => (
  <div className="flex flex-wrap gap-1 mt-1.5">
    {reactions.map((reaction: any, idx: any) => (
      <button
        key={idx}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors text-xs active:scale-95"
        onClick={() => handleToggleReaction(reaction.emoji)}
      >
        {reaction.emoji.startsWith(':') ? (
          <img
            src={`/placeholder.svg?height=16&width=16&query=${reaction.emoji}`}
            alt={reaction.emoji}
            className="h-4 w-4"
          />
        ) : (
          <span className="text-sm leading-none">{reaction.emoji}</span>
        )}
        <span className="font-medium text-muted-foreground">{reaction.count}</span>
      </button>
    ))}

    <CustomEmojiPicker onEmojiSelect={handleAddReaction}>
      <button className="flex items-center justify-center h-6 w-6 rounded border border-dashed border-border hover:bg-muted hover:border-primary/40 transition-colors">
        <Smile className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </CustomEmojiPicker>
  </div>
));

MessageReactions.displayName = 'MessageReactions';

const MessageToolbar = memo(({
  handleAddReaction,
  handleReply,
  setIsMenuOpen,
  handleCopyMessageLink,
  messageContent,
  handleEditMessage,
  handleDeleteMessage
}: {
  handleAddReaction: (emoji: string, isCustom?: boolean, customEmojiId?: string) => void,
  handleReply: () => void,
  setIsMenuOpen: (open: boolean) => void,
  handleCopyMessageLink: () => void,
  messageContent: string,
  handleEditMessage: () => void,
  handleDeleteMessage: () => void
}) => (
  <div className="hidden md:flex absolute -top-4.5 right-4 items-center bg-background border border-border rounded shadow-md p-0.5 z-20 animate-in fade-in zoom-in-95 duration-75">
    <CustomEmojiPicker onEmojiSelect={handleAddReaction}>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-muted">
        <Smile className="h-4 w-4 text-muted-foreground" />
      </Button>
    </CustomEmojiPicker>

    <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-muted" onClick={handleReply}>
      <MessageSquare className="h-4 w-4 text-muted-foreground" />
    </Button>

    <DropdownMenu onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-muted">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={handleReply} className="cursor-pointer">
          <Reply className="mr-2 h-4 w-4" /> Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyMessageLink} className="cursor-pointer">
          <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(messageContent)} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" /> Copy Text
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEditMessage} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleDeleteMessage}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
));

MessageToolbar.displayName = 'MessageToolbar';

export const MessageItem = memo(function MessageItem({
  message,
  showAvatar = true,
  onReply,
  onReaction,
  depth = 0,
  isReply = false,
  channelId = undefined,
  workspaceId = undefined,
  isHighlighted = false,
  highlightRef,
}: MessageItemProps) {
  const updateMessageMutation = useUpdateMessage();
  const deleteMessageMutation = useDeleteMessage();
  const triggerActionMutation = useTriggerAction(workspaceId);
  const { data: session } = useSession();
  const currentUser = session?.user;
  const { data: users } = useUsers();

  const user = (message as any).user ||
    users?.find((u: any) => u.id === message.userId) || { name: 'Unknown', avatar: '' };
  const isMentioned = currentUser?.username && message.content.includes(`@${currentUser.username}`);

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userBadges = (user as any)?.badges || [];

  const handleAddReaction = (emoji: string, isCustom?: boolean, customEmojiId?: string) => {
    onReaction?.(message.id, emoji, isCustom, customEmojiId);
  };

  const handleToggleReaction = (emoji: string) => {
    onReaction?.(message.id, emoji);
  };

  const handleReply = () => {
    onReply?.(message.id);
  };

  const handleEditMessage = () => setIsEditing(true);

  const handleDeleteMessage = () => {
    if (!channelId) return;
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessageMutation.mutate({ id: message.id, channelId });
    }
  };

  const handleSaveEdit = (newContent: string) => {
    if (!channelId) return;
    updateMessageMutation.mutate({ id: message.id, channelId, content: newContent });
    setIsEditing(false);
  };

  const handleCopyMessageLink = () => {
    const baseUrl = workspaceId ? `/workspace/${workspaceId}/channels` : '/channels';
    const messageUrl = `${window.location.origin}${baseUrl}/${channelId}?messageId=${message.id}`;
    navigator.clipboard.writeText(messageUrl);
    toast.success('Link copied', { description: 'Message link copied to clipboard' });
  };

  const isImplicitCode = useMemo(() =>
    (!message.messageType || message.messageType === 'standard') &&
    (CODE_BLOCK_REGEX.test(message.content) || message.metadata?.isImplicit)
  , [message.content, message.messageType, message.metadata]);

  const handleCustomAction = useCallback(async (actionId: string, data: any) => {
    try {
      await triggerActionMutation.mutateAsync({
        messageId: message.id,
        actionId,
        payload: data.payload,
        formState: data.formState,
      });
      toast.success('Action sent');
    } catch (error) {
      toast.error('Failed to trigger action');
    }
  }, [message.id, triggerActionMutation]);

  const renderMessageBody = useCallback(() => {
    if (isImplicitCode) {
      const { language, code } = extractCodeInfo(message.content);
      return (
        <div className="w-full mt-2">
          <SyntaxHighlighter
            code={code}
            language={language as string}
            fileName={((message.metadata?.fileName as string) || '') as any}
          />
        </div>
      );
    }

    if (['custom', 'approval', 'report'].includes(message.messageType)) {
      return (
        <CustomMessage
          message={message}
          onAction={handleCustomAction}
          isLoading={triggerActionMutation.isPending}
        />
      );
    }

    return renderCustomMessage(message);
  }, [isImplicitCode, message, handleCustomAction, triggerActionMutation.isPending]);

  // Find unique links to avoid duplicate previews for the same URL
  const detectedLinks = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return Array.from(new Set(message.content.match(urlRegex) || []));
  }, [message.content]);

  const linksToPreview = useMemo(() => detectedLinks.slice(0, 3), [detectedLinks]);

  // Strip the previewed links from the displayed text
  const displayContent = useMemo(() => {
    let content = message.content;
    linksToPreview.forEach((link: any) => {
      // Escape special characters in the link to safely use it in regex
      const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      content = content.replace(new RegExp(escapedLink, 'g'), '');
    });
    return content.trim();
  }, [message.content, linksToPreview]);

  const showToolbar = isHovered || isMenuOpen;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={highlightRef}
          className={cn(
            // Discord base: 16px horizontal padding, minimal vertical
            'group relative flex items-start px-4 gap-3 w-full select-text',
            // Vertical padding: compact for grouped, slightly more for new blocks
            showAvatar ? 'pt-[6px] pb-[2px]' : 'pt-0 pb-0',
            // Hover / menu-open background
            'hover:bg-[#0000000a] dark:hover:bg-[#ffffff05]',
            isMenuOpen && 'bg-[#0000000a] dark:bg-[#ffffff05]',
            // Mention highlight
            isMentioned && 'bg-yellow-500/10 border-l-2 border-yellow-500 pl-[14px]',
            // Highlighted message (linked)
            isHighlighted && 'bg-primary/10'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* ── Left column: avatar or compact timestamp ── */}
          <div className={cn('flex-shrink-0 w-10 flex justify-center', showAvatar ? 'mt-0.5' : 'mt-0')}>
            {showAvatar ? (
              <Avatar className="h-10 w-10 rounded-full overflow-hidden cursor-pointer hover:brightness-90 transition-all">
                <AvatarImage src={user?.avatar || user?.image} alt={user?.name} />
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                  {user?.name?.slice(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
            ) : (
              // Grouped message: show short timestamp only on hover, exactly like Discord
              <span
                className={cn(
                  'text-[11px] text-muted-foreground/60 leading-[1.375rem] transition-opacity duration-100 whitespace-nowrap',
                  showToolbar ? 'opacity-100' : 'opacity-0'
                )}
              >
                {format(new Date(message.timestamp || new Date()), 'HH:mm')}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-hidden pb-[2px]">
            {showAvatar && <MessageHeader user={user} message={message} userBadges={userBadges} isReply={isReply} />}
            {isEditing ? (
              <MessageEditor initialContent={message.content} onSave={handleSaveEdit} onCancel={() => setIsEditing(false)} />
            ) : (
              <>
                {!isImplicitCode && displayContent && (
                  <div className="text-[15px] leading-[1.375rem] text-foreground break-words">
                    <MarkdownRenderer content={displayContent} className="whitespace-pre-wrap max-w-full overflow-x-hidden" />
                  </div>
                )}
                <div className="w-full overflow-x-auto mt-0.5">{renderMessageBody()}</div>
              </>
            )}
            <DocumentEmbed message={message} />
            <MessageAttachments attachments={message.attachments} message={message} />
            {message.actions && message.actions.length > 0 && (
              <MessageActions actions={message.actions} messageId={message.id} triggerActionMutation={triggerActionMutation} />
            )}
            {linksToPreview.map((link, idx) => <LinkPreview key={idx} url={link as any} />)}
            {message.reactions && message.reactions.length > 0 && (
              <MessageReactions
                reactions={message.reactions}
                messageId={message.id}
                handleAddReaction={handleAddReaction}
                handleToggleReaction={handleToggleReaction}
              />
            )}
          </div>

          {showToolbar && (
            <MessageToolbar
              handleAddReaction={handleAddReaction}
              handleReply={handleReply}
              setIsMenuOpen={setIsMenuOpen}
              handleCopyMessageLink={handleCopyMessageLink}
              messageContent={message.content}
              handleEditMessage={handleEditMessage}
              handleDeleteMessage={handleDeleteMessage}
            />
          )}
        </div>
      </ContextMenuTrigger>

      {/* Right-click context menu */}
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={handleReply}>
          <Reply className="mr-2 h-4 w-4" /> Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyMessageLink}>
          <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
        </ContextMenuItem>
        <ContextMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
          <Copy className="mr-2 h-4 w-4" /> Copy Text
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleEditMessage}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </ContextMenuItem>
        <ContextMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteMessage}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});
