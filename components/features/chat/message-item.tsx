"use client";

import {
  Smile,
  MessageSquare,
  Bookmark,
  Copy,
  Pin,
  Trash2,
  Edit,
  LinkIcon,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/types";
import { mockUsers } from "@/lib/mock-data";
import { cn, formatTime } from "@/lib/utils";
import { CODE_BLOCK_REGEX, renderCustomMessage } from "@/lib/message-renderer";
import { CustomEmojiPicker } from "@/components/shared/custom-emoji-picker";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { CustomMessage } from "@/components/features/chat/message-types/custom-message";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/shared/context-menu";
import { useUpdateMessage, useDeleteMessage } from "@/hooks/api/use-messages";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { UserBadgeDisplay } from "../social/user-badge-display";

interface MessageItemProps {
  message: Message;
  showAvatar?: boolean;
  onReply?: (messageId: string) => void;
  onReaction?: (
    messageId: string,
    emoji: string,
    isCustom?: boolean,
    customEmojiId?: string
  ) => void;
  depth?: number;
  isReply?: boolean;
  channelId?: string;
  isHighlighted?: boolean;
  highlightRef?: React.RefObject<HTMLDivElement>;
}

const mockUserBadges: Record<string, any[]> = {
  "1": [
    {
      id: "1",
      name: "Admin",
      icon: "shield",
      color: "#ef4444",
      bgColor: "#fef2f2",
      tier: "legendary" as const,
      category: "role",
      isPrimary: true,
    },
    {
      id: "2",
      name: "Early Adopter",
      icon: "star",
      color: "#eab308",
      bgColor: "#fefce8",
      tier: "premium" as const,
      category: "special",
    },
  ],
  "2": [
    {
      id: "3",
      name: "Top Contributor",
      icon: "trophy",
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      tier: "elite" as const,
      category: "achievement",
      isPrimary: true,
    },
  ],
};

export function MessageItem({
  message,
  showAvatar = true,
  onReply,
  onReaction,
  depth = 0,
  isReply = false,
  channelId = undefined,
  isHighlighted = false,
  highlightRef,
}: MessageItemProps) {
  const updateMessageMutation = useUpdateMessage();
  const deleteMessageMutation = useDeleteMessage();
  const { toast } = useToast();

  const user = mockUsers.find((u) => u.id === message.userId);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const userBadges = mockUserBadges[message.userId] || [];

  const handleAddReaction = (
    emoji: string,
    isCustom?: boolean,
    customEmojiId?: string
  ) => {
    onReaction?.(message.id, emoji, isCustom, customEmojiId);
  };

  const handleToggleReaction = (emoji: string) => {
    onReaction?.(message.id, emoji);
  };

  const handleReply = () => {
    onReply?.(message.id);
  };

  const handleEditMessage = () => {
    setIsEditing(true);
  };

  const handleDeleteMessage = () => {
    if (!channelId) return;
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessageMutation.mutate({
        id: message.id,
        channelId,
      });
    }
  };

  const handleSaveEdit = (newContent: string) => {
    if (!channelId) return;
    updateMessageMutation.mutate({
      id: message.id,
      channelId,
      content: newContent,
    });
    setIsEditing(false);
  };

  const handleCopyMessageLink = () => {
    const messageUrl = `${window.location.origin}/channels/${channelId}?messageId=${message.id}`;
    navigator.clipboard.writeText(messageUrl);
    toast({
      title: "Link copied",
      description: "Message link copied to clipboard",
    });
  };

  const isImplicitCode = useMemo(() => {
    return (
      (!message.messageType || message.messageType === "standard") &&
      (CODE_BLOCK_REGEX.test(message.content) || message.metadata?.isImplicit)
    );
  }, [message.content, message.messageType, message.metadata]);

  // 2. RENDER COMPONENT STRATEGY
  const customComponent = useMemo(() => {
    if (isImplicitCode) {
      return <CustomMessage message={message} readOnly />;
    }
    return renderCustomMessage(message);
  }, [isImplicitCode, message]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={highlightRef}
          className={cn(
            "group relative px-2 md:px-4 py-1 md:py-2 hover:bg-muted/30 transition-colors w-full touch-manipulation",
            // Responsive left padding when avatar is hidden
            !showAvatar && "pl-12 md:pl-16",
            // Responsive nesting indentation
            isReply && "border-l-2 border-primary/30 pl-2 md:pl-4",
            depth > 0 && "ml-2 md:ml-12",
            isHighlighted && "bg-primary/20 animate-pulse"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isReply && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20" />
          )}

          <div className="flex gap-2 md:gap-3 items-start max-w-full">
            {showAvatar ? (
              <Avatar className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 mt-0.5">
                <AvatarImage
                  src={user?.avatar || "/placeholder.svg"}
                  alt={user?.name}
                />
                <AvatarFallback className="text-[10px] md:text-xs bg-primary text-primary-foreground">
                  {user?.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-8 md:w-9 flex-shrink-0 flex items-start justify-center">
                {/* Only show timestamp on hover for desktop, maybe always for mobile if needed, but keeping logic consistent */}
                {isHovered && (
                  <span className="text-[10px] text-muted-foreground hidden md:inline-block">
                    {formatTime(message.timestamp)}
                  </span>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0 overflow-hidden">
              {showAvatar && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-0.5 md:mb-1">
                  <span className="font-semibold text-sm truncate max-w-[150px] md:max-w-none">
                    {user?.name}
                  </span>

                  {userBadges.length > 0 && (
                    <div className="flex-shrink-0">
                      <UserBadgeDisplay
                        badges={userBadges}
                        maxDisplay={2}
                        size="sm"
                      />
                    </div>
                  )}

                  <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(message.timestamp)}
                  </span>

                  {isReply && (
                    <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span className="hidden sm:inline">replied</span>
                    </span>
                  )}
                </div>
              )}

              {isEditing ? (
                <div className="w-full pr-2">
                  <textarea
                    value={message.content}
                    onChange={(e) => handleSaveEdit(e.target.value)}
                    className="text-sm leading-relaxed text-foreground border border-border rounded-lg bg-card p-2 w-full font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                    rows={5}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(message.content)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {!isImplicitCode && (
                    <div className="text-sm leading-relaxed text-foreground break-words">
                      <MarkdownRenderer
                        content={message.content}
                        className="whitespace-pre-wrap max-w-full overflow-x-hidden"
                      />
                    </div>
                  )}
                  {/* Container for custom components ensuring they don't overflow on mobile */}
                  <div className="w-full overflow-x-auto">
                    {customComponent}
                  </div>
                </>
              )}

              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-2 md:p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer max-w-full md:max-w-sm"
                    >
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          🔗
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.name}
                        </p>
                        {attachment.size && (
                          <p className="text-xs text-muted-foreground">
                            {attachment.size}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reactions: Mobile friendly spacing and touch targets */}
              {(message.reactions && message.reactions.length > 0) ||
              isHovered ? (
                <div
                  className={cn(
                    "flex flex-wrap gap-1.5 mt-2",
                    // If no reactions yet, hide this row on mobile unless there's a way to trigger it
                    !message.reactions?.length && !isHovered && "hidden"
                  )}
                >
                  {message.reactions?.map((reaction, idx) => (
                    <button
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/50 transition-colors text-xs active:scale-95"
                      onClick={() => handleToggleReaction(reaction.emoji)}
                    >
                      {reaction.emoji.startsWith(":") ? (
                        <img
                          src={`/placeholder.svg?height=16&width=16&query=${reaction.emoji}`}
                          alt={reaction.emoji}
                          className="h-4 w-4"
                        />
                      ) : (
                        <span className="text-sm">{reaction.emoji}</span>
                      )}
                      <span className="font-medium text-muted-foreground">
                        {reaction.count}
                      </span>
                    </button>
                  ))}

                  {/* Always show Add Reaction button on desktop hover, or if reactions exist */}
                  <CustomEmojiPicker onEmojiSelect={handleAddReaction}>
                    <button
                      className={cn(
                        "flex items-center justify-center h-6 w-6 md:h-7 md:w-7 rounded-md border border-dashed border-border hover:bg-muted hover:border-primary/50 transition-colors",
                        // On mobile, only show if there are already reactions, otherwise rely on ContextMenu/LongPress to start
                        !message.reactions?.length && "hidden md:flex"
                      )}
                    >
                      <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </CustomEmojiPicker>
                </div>
              ) : null}
            </div>
          </div>

          {isHovered && (
            <div className="hidden md:flex absolute -top-3 right-4 items-center gap-0.5 bg-background border border-border rounded-lg shadow-sm p-0.5 z-10 animate-in fade-in zoom-in-95 duration-100">
              <CustomEmojiPicker onEmojiSelect={handleAddReaction}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted"
                >
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CustomEmojiPicker>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-muted"
                onClick={handleReply}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </Button>
              <ContextMenuTrigger>
                {/* Visual indicator that right click provides more */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </ContextMenuTrigger>
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      {/* Context Menu (Long Press on Mobile) */}
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleReply}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyMessageLink}>
          <LinkIcon className="mr-2 h-4 w-4" />
          Copy Link
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => navigator.clipboard.writeText(message.content)}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Text
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleEditMessage}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleDeleteMessage}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
