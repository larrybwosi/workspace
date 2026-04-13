import type React from "react"
import type { Message, MessageMetadata, MessageType, MessageAction } from "@repo/types"

export * from "@repo/types"

export interface CustomMessageComponent {
  type: MessageType
  render: (message: Message, metadata: MessageMetadata) => React.ReactNode
  actions?: MessageAction[]
}
