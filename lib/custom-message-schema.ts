"use client"

import { z } from "zod"

export const CustomMessageComponentSchema = z.object({
  type: z.enum([
    "text",
    "button",
    "badge",
    "progress",
    "card",
    "list",
    "table",
    "chart",
    "timeline",
    "approval",
    "alert",
  ]),
  props: z.record(z.any()).optional(),
  children: z.lazy(() => z.array(CustomMessageComponentSchema)).optional(),
})

export const CustomMessageUIDefinitionSchema = z.object({
  id: z.string().optional(),
  version: z.string().default("1.0"),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["notification", "approval", "update", "alert", "info"]).default("notification"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  icon: z.string().optional(),
  color: z.string().optional(),
  components: z.array(CustomMessageComponentSchema).min(1),
  actions: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["primary", "secondary", "destructive"]).default("secondary"),
        icon: z.string().optional(),
        handler: z.enum(["link", "callback", "update", "approve", "reject"]).default("callback"),
        targetUrl: z.string().optional(),
        callbackData: z.record(z.any()).optional(),
      }),
    )
    .optional(),
  metadata: z.object({
    source: z.string(),
    sourceId: z.string().optional(),
    externalId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  style: z
    .object({
      layout: z.enum(["default", "compact", "detailed"]).default("default"),
      theme: z.enum(["light", "dark", "auto"]).default("auto"),
      customCSS: z.string().optional(),
    })
    .optional(),
  constraints: z
    .object({
      targetUsers: z.array(z.string()).optional(),
      targetChannels: z.array(z.string()).optional(),
      requiresApproval: z.boolean().default(false),
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
})

export type CustomMessageUIDefinition = z.infer<typeof CustomMessageUIDefinitionSchema>
export type CustomMessageComponent = z.infer<typeof CustomMessageComponentSchema>
