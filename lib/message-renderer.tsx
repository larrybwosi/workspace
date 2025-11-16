"use client"

import type * as React from "react"
import type { Message, MessageMetadata, MessageType } from "./types"
import { ApprovalMessage } from "@/components/message-types/approval-message"
import { CommentRequestMessage } from "@/components/message-types/comment-request-message"
import { CodeMessage } from "@/components/message-types/code-message"
import { CustomMessage } from "@/components/message-types/custom-message"

export class MessageRendererFactory {
  private static renderers = new Map<MessageType, React.ComponentType<any>>()

  static register(type: MessageType, component: React.ComponentType<any>) {
    this.renderers.set(type, component)
  }

  static render(message: Message, metadata: MessageMetadata = {}) {
    const type = message.messageType || "standard"
    const Renderer = this.renderers.get(type)

    if (!Renderer) {
      return null
    }

    return <Renderer message={message} metadata={metadata} />
  }

  static hasRenderer(type: MessageType): boolean {
    return this.renderers.has(type)
  }
}

// Register built-in message types
MessageRendererFactory.register("approval", ApprovalMessage)
MessageRendererFactory.register("comment-request", CommentRequestMessage)
MessageRendererFactory.register("code", CodeMessage)
MessageRendererFactory.register("custom" as MessageType, CustomMessage)

// Export helper function for easy use
export function renderCustomMessage(message: Message) {
  if (!message.messageType || message.messageType === "standard") {
    return null
  }

  return MessageRendererFactory.render(message, message.metadata || {})
}
