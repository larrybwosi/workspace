"use client";

import type { Message, MessageMetadata, MessageType } from "./types";
import { ApprovalMessage } from "@/components/features/chat/message-types/approval-message";
import { CommentRequestMessage } from "@/components/features/chat/message-types/comment-request-message";
import { CodeMessage } from "@/components/features/chat/message-types/code-message";
import { CustomMessage } from "@/components/features/chat/message-types/custom-message";

// Revised Regex:
// 1. ^\s*``` : Starts with optional whitespace and backticks
// 2. ([a-zA-Z0-9+#\-\.]+)? : Optional Capture Group 1 (Language). Allows chars, numbers, +, # (c#), - (obj-c), . (vb.net)
// 3. \s+ : Required whitespace/newline after the language tag
// 4. ([\s\S]+?) : Capture Group 2 (The Code). Lazy match of any character including newlines.
// 5. ```\s*$ : Ends with backticks and optional whitespace
export const CODE_BLOCK_REGEX =
  /^\s*```([a-zA-Z0-9+#\-\.]+)?\s+([\s\S]+?)```\s*$/;

/**
 * Parses a markdown code block to extract the language and the raw code.
 */
export function extractCodeInfo(content: string) {
  const match = content.match(CODE_BLOCK_REGEX);
  if (!match) return { language: null, code: content };

  return {
    language: match[1]?.toLowerCase() || "text", // Default to text if no language provided
    code: match[2], // The inner code content without backticks
  };
}

export class MessageRendererFactory {
  private static renderers = new Map<MessageType, React.ComponentType<any>>();

  static register(type: MessageType, component: React.ComponentType<any>) {
    this.renderers.set(type, component);
  }

  static render(message: Message, metadata: MessageMetadata = {}) {
    const type = message.messageType || "standard";
    const Renderer = this.renderers.get(type);

    if (!Renderer) {
      return null;
    }

    return <Renderer message={message} metadata={metadata} />;
  }

  static hasRenderer(type: MessageType): boolean {
    return this.renderers.has(type);
  }
}

// Register built-in message types
MessageRendererFactory.register("approval", ApprovalMessage);
MessageRendererFactory.register("comment-request", CommentRequestMessage);
MessageRendererFactory.register("code", CodeMessage);
MessageRendererFactory.register("custom" as MessageType, CustomMessage);

export function renderCustomMessage(message: Message) {
  if (!message.messageType || message.messageType === "standard") {
    return null;
  }

  return MessageRendererFactory.render(message, message.metadata || {});
}
