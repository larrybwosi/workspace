"use client";

import React, { useState, useRef } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileText,
  XCircle,
  MoreHorizontal,
  CornerDownRight,
  AlertCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn, formatTime } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { mockUsers } from "@/lib/mock-data";
// Ensure this path matches your project structure
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

// --- Styles for Markdown Content ---
// These classes ensure headers, lists, and code blocks render correctly inside the cards.
const MARKDOWN_STYLES = cn(
  "[&_p]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0",
  "[&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2",
  "[&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1",
  "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2",
  "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-2",
  "[&_li]:my-0.5",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
  "[&_code]:bg-muted/50 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:border [&_code]:border-border/50",
  "[&_pre]:bg-muted/50 [&_pre]:p-2 [&_pre]:rounded-md [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:border-0",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80"
);

// --- Types ---

interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
}

interface ResourceMetadata {
  title: string;
  type: "document" | "image" | "code" | "link";
  url?: string;
  preview?: string;
  fileSize?: string;
}

interface CommentRequestProps {
  message: Message;
  currentUser: { id: string; name: string; avatar?: string };
  resourceMetadata?: ResourceMetadata;
  initialComments?: Comment[];
  onResolve?: (messageId: string) => void;
  onViewDetails?: (resourceId: string) => void;
  onAddComment?: (messageId: string, comment: string) => void;
}

/**
 * CommentRequestMessage
 * A professional UI for soliciting and managing feedback on resources.
 */
export function CommentRequestMessage({
  message,
  currentUser,
  resourceMetadata = message.metadata?.resource || {
    title: "Untitled Resource",
    type: "document",
  },
  initialComments = [],
  onResolve,
  onViewDetails,
  onAddComment,
}: CommentRequestProps) {
  const [status, setStatus] = useState<"open" | "resolved" | "closed">(
    message.metadata?.status || "open"
  );
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const requester = mockUsers.find((u) => u.id === message.userId);
  const isResolved = status === "resolved";
  const commentCount = comments.length;

  const handleResolve = () => {
    setStatus("resolved");
    onResolve?.(message.id);
  };

  const handleReopen = () => {
    setStatus("open");
  };

  const handleSubmitComment = () => {
    if (!inputValue.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      content: inputValue,
      timestamp: new Date(),
    };

    setComments([...comments, newComment]);
    onAddComment?.(message.id, inputValue);
    setInputValue("");

    if (!isExpanded) setIsExpanded(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <div className="flex gap-4 px-4 py-4 hover:bg-muted/20 transition-colors rounded-xl group animate-in fade-in duration-300">
      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">
              {requester?.name}
            </span>
            <span className="text-muted-foreground text-xs">
              requested feedback
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
          </div>
          {getStatusBadge(status)}
        </div>

        {/* The "Context" Card */}
        <Card
          className={cn(
            "w-full transition-all duration-200 overflow-hidden border",
            isResolved
              ? "bg-muted/30 border-border/60 shadow-none opacity-90"
              : "bg-card border-border shadow-sm hover:border-primary/20 hover:shadow-md"
          )}
        >
          <div
            className={cn(
              "h-1 w-full",
              isResolved ? "bg-green-500/40" : "bg-amber-500"
            )}
          />

          <CardHeader className="p-4 pb-3">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3
                    className={cn(
                      "font-medium text-sm",
                      isResolved && "line-through text-muted-foreground"
                    )}
                  >
                    {resourceMetadata.title}
                  </h3>
                </div>

                {/* UPDATED: Main Message Body 
                  Using MarkdownRenderer wrapped in style classes 
                */}
                <div
                  className={cn(
                    "text-sm text-foreground/90 leading-relaxed pt-1",
                    MARKDOWN_STYLES
                  )}
                >
                  <MarkdownRenderer content={message.content} />
                </div>

                {/* Resource Metadata Pill */}
                {resourceMetadata.url && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground border border-border/50">
                      <span className="truncate max-w-[200px]">
                        {resourceMetadata.url}
                      </span>
                      {resourceMetadata.fileSize && (
                        <span className="opacity-50">
                          | {resourceMetadata.fileSize}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 text-muted-foreground/70 hover:text-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewDetails?.(message.id)}>
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Open Resource
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {status === "open" ? (
                    <DropdownMenuItem onClick={handleResolve}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      Mark Resolved
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleReopen}>
                      <Clock className="w-4 h-4 mr-2" />
                      Re-open
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <XCircle className="w-4 h-4 mr-2" />
                    Delete Request
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardFooter className="p-0 bg-muted/30 border-t">
            <Button
              variant="ghost"
              className="w-full h-9 rounded-t-none rounded-b-lg text-xs font-normal text-muted-foreground hover:text-primary justify-between px-4"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                {commentCount > 0
                  ? `${commentCount} comments`
                  : "No comments yet"}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Comment Thread Section */}
        {isExpanded && (
          <div className="pl-4 space-y-4 pt-1 animate-in slide-in-from-top-2 duration-200">
            {/* List of Previous Comments */}
            {comments.length > 0 && (
              <div className="relative space-y-4">
                <div className="absolute left-[-20px] top-2 bottom-4 w-px bg-border/60" />
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="relative flex gap-3 items-start">
              <div className="absolute left-[-20px] top-4 w-3 h-px bg-border/60" />
              <CornerDownRight className="w-4 h-4 text-muted-foreground/40 mt-3 flex-shrink-0" />

              <div
                className={cn(
                  "flex-1 relative rounded-lg border bg-background shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary focus-within:border-primary",
                  isResolved && "opacity-60 grayscale"
                )}
              >
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isResolved ? "This thread is resolved." : "Add a comment..."
                  }
                  disabled={isResolved}
                  className="min-h-[44px] max-h-[120px] w-full resize-none border-0 bg-transparent py-3 px-3 pr-12 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
                  rows={1}
                />
                <div className="absolute right-1.5 bottom-1.5 flex gap-1">
                  <Button
                    disabled={!inputValue.trim() || isResolved}
                    onClick={handleSubmitComment}
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-md"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-Components ---

function CommentItem({
  comment,
  currentUser,
}: {
  comment: Comment;
  currentUser: any;
}) {
  const author = mockUsers.find((u) => u.id === comment.userId) || {
    name: "Unknown",
    avatar: "",
    id: "unknown",
  };
  const isMe = currentUser.id === comment.userId;

  return (
    <div className="flex gap-3 group/comment">
      <Avatar className="h-6 w-6 border border-border mt-0.5">
        <AvatarImage src={author.avatar} />
        <AvatarFallback className="text-[9px]">
          {author.name.substring(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground/90">
            {author.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatTime(comment.timestamp)}
          </span>
        </div>

        {/* UPDATED: Comment Body 
          Using MarkdownRenderer with overflow protection and markdown styles 
        */}
        <div
          className={cn(
            "text-sm p-2.5 rounded-lg w-fit max-w-[90%] overflow-hidden",
            isMe
              ? "bg-primary/5 text-primary-foreground/90 border border-primary/10"
              : "bg-muted/40 text-foreground border border-border/40",
            MARKDOWN_STYLES
          )}
        >
          <MarkdownRenderer content={comment.content} />
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "resolved":
      return (
        <Badge
          variant="outline"
          className="h-6 px-2 bg-green-500/10 text-green-700 border-green-200 text-[10px] gap-1.5 hover:bg-green-500/20 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          RESOLVED
        </Badge>
      );
    case "open":
    default:
      return (
        <Badge
          variant="outline"
          className="h-6 px-2 bg-amber-500/10 text-amber-700 border-amber-200 text-[10px] gap-1.5 hover:bg-amber-500/20 transition-colors"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          NEEDS REVIEW
        </Badge>
      );
  }
}
