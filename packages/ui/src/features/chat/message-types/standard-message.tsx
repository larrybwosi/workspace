"use client";

import { MessageRenderer } from "../message-renderer";
import type { Message, MessageMetadata } from "../../../lib/types";

interface StandardMessageProps {
  message: Message;
  metadata?: MessageMetadata;
}

export function StandardMessage({ message, metadata }: StandardMessageProps) {
  return (
    <MessageRenderer
      content={message.content}
      metadata={metadata}
    />
  );
}
