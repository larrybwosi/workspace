import { z } from "zod";

/**
 * GraphQL-inspired Custom Message Schema
 *
 * This schema defines a structured, node-based representation for custom messages.
 * It separates the underlying "Data" from the "UI" components, allowing for
 * flexible and type-safe rendering.
 */

// Basic Value types for properties
export const PropertyValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.record(z.string(), z.any()),
]);

// A "Node" is the building block of our message
// Similar to a GraphQL execution result but for UI components
export type MessageNode = {
  /** The type of component (e.g., 'Text', 'Button', 'Card', 'Layout') */
  type: string;
  /** Unique identifier for the node within the message */
  id?: string;
  /** Key-value pairs for component-specific configuration */
  properties?: Record<string, any>;
  /** Nested child nodes */
  children?: MessageNode[];
  /** Optional metadata about this specific node (e.g., visibility, roles) */
  metadata?: Record<string, any>;
};

// Zod Schema for recursive MessageNode
export const MessageNodeSchema: z.ZodType<MessageNode> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    id: z.string().optional(),
    properties: z.record(z.string(), z.any()).optional(),
    children: z.array(MessageNodeSchema).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
);

/**
 * The Root Message Schema
 */
export const CustomMessageSchema = z.object({
  /** Schema Version (e.g., "v1") */
  version: z.string().default("v1"),
  /** The human-readable title for the message schema/template */
  templateId: z.string().optional(),
  /** The logical "Type" of the custom message (e.g., 'APPROVAL', 'REPORT') */
  type: z.string(),
  /** Top-level configuration and branding */
  context: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  }),
  /** The hierarchical UI structure */
  root: MessageNodeSchema,
  /** Pre-defined actions that can be performed on the message */
  actions: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["PRIMARY", "SECONDARY", "DESTRUCTIVE", "GHOST"]).default("SECONDARY"),
        icon: z.string().optional(),
        /** Handler defines how the client should respond to this action */
        handler: z.object({
          type: z.enum(["CALLBACK", "LINK", "MODAL"]),
          url: z.string().optional(),
          callbackId: z.string().optional(),
          payload: z.record(z.string(), z.any()).optional(),
        }),
      })
    )
    .optional(),
  /** Shared data used by various nodes in the message */
  data: z.record(z.string(), z.any()).optional(),
  /** Constraints for visibility and interaction */
  constraints: z
    .object({
      targetUsers: z.array(z.string()).optional(),
      requiresPermissions: z.array(z.string()).optional(),
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
});

export type CustomMessage = z.infer<typeof CustomMessageSchema>;

// Helpers for specific message types

/**
 * Creates a standard Approval Message UI structure
 */
export const createApprovalMessage = (data: {
  title: string;
  description?: string;
  fields: { label: string; value: string }[];
  callbackId: string;
}): CustomMessage => ({
  version: "v1",
  type: "APPROVAL",
  context: {
    title: data.title,
    description: data.description,
    icon: "CheckSquare",
    priority: "normal",
  },
  root: {
    type: "Layout.Card",
    children: [
      {
        type: "Layout.Grid",
        properties: { columns: 2 },
        children: data.fields.map((f) => ({
          type: "Display.Field",
          properties: { label: f.label, value: f.value },
        })),
      },
    ],
  },
  actions: [
    {
      id: "approve",
      label: "Approve",
      type: "PRIMARY",
      icon: "Check",
      handler: {
        type: "CALLBACK",
        callbackId: data.callbackId,
        payload: { action: "approve" },
      },
    },
    {
      id: "reject",
      label: "Reject",
      type: "DESTRUCTIVE",
      icon: "X",
      handler: {
        type: "CALLBACK",
        callbackId: data.callbackId,
        payload: { action: "reject" },
      },
    },
  ],
});

/**
 * Creates a standard Report Message UI structure
 */
export const createReportMessage = (data: {
  title: string;
  reportId: string;
  summary: string;
  metrics: { label: string; value: string | number }[];
}): CustomMessage => ({
  version: "v1",
  type: "REPORT",
  context: {
    title: data.title,
    icon: "BarChart",
    priority: "normal",
  },
  root: {
    type: "Layout.Stack",
    children: [
      {
        type: "Text.Paragraph",
        properties: { content: data.summary },
      },
      {
        type: "Data.StatsGrid",
        children: data.metrics.map((m) => ({
          type: "Data.Stat",
          properties: { label: m.label, value: m.value },
        })),
      },
    ],
  },
  actions: [
    {
      id: "view_details",
      label: "View Full Report",
      type: "SECONDARY",
      icon: "ExternalLink",
      handler: {
        type: "LINK",
        url: `/reports/${data.reportId}`,
      },
    },
  ],
});
