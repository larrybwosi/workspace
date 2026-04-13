"use client";

import { MessageRenderer } from "../message-renderer";
import type { Message, MessageMetadata } from "../../../lib/types";
import { cn } from "../../../lib/utils";

interface CodeMessageProps {
  message: any;
  metadata: MessageMetadata;
  className?: string;
}

export function CodeMessage({
  message,
  metadata,
  className,
}: CodeMessageProps) {
  return (
    <MessageRenderer
      content={message.content}
      metadata={metadata}
      className={className}
    />
  );
}
