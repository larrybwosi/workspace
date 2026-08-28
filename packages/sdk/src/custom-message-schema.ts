import { z } from 'zod';

/**
 * GraphQL-inspired Custom Message Schema
 *
 * This schema defines a structured, node-based representation for custom messages.
 * It separates the underlying "Data" from the "UI" components, allowing for
 * flexible and type-safe rendering.
 */

/** Basic Value types for properties in custom message components */
export const PropertyValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.record(z.string(), z.any()),
]);

/**
 * Validation Schema for Input components in custom messages.
 */
export const ValidationSchema = z.object({
  /** Whether filling or selecting this field is strictly required before submitting an action */
  required: z.boolean().optional(),
  /** Regular expression string pattern for string validation */
  pattern: z.string().optional(),
  /** Minimum text length requirement */
  minLength: z.number().optional(),
  /** Maximum text length allowed */
  maxLength: z.number().optional(),
  /** Minimum numeric value allowed */
  min: z.number().optional(),
  /** Maximum numeric value allowed */
  max: z.number().optional(),
  /** Custom error message displayed when validation fails */
  errorMessage: z.string().optional(),
});

export type ValidationSchemaType = z.infer<typeof ValidationSchema>;

/**
 * Data Source Schema for dynamic content (e.g., Select options or dynamic dropdowns).
 */
export const DataSourceSchema = z.object({
  /** Source type: 'STATIC' for inline items, 'API' for external fetching, 'VARIABLE' for message data interpolation */
  type: z.enum(['STATIC', 'API', 'VARIABLE']),
  /** For STATIC: explicit list of available options */
  items: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
  })).optional(),
  /** For API: endpoint URL from which items will be fetched */
  url: z.string().optional(),
  /** For API: HTTP request method */
  method: z.enum(['GET', 'POST']).default('GET').optional(),
  /** For API: HTTP headers to send with the fetch request */
  headers: z.record(z.string(), z.string()).optional(),
  /** For VARIABLE: property key inside the custom message `data` object containing option items */
  key: z.string().optional(),
  /** Key mapping configuration when response objects do not natively use `label` and `value` */
  map: z.object({
    label: z.string(),
    value: z.string(),
  }).optional(),
});

/**
 * Condition Schema for Visibility and Logical Evaluation.
 */
export const ConditionSchema = z.object({
  /** The field ID or path inside data/formState to evaluate */
  field: z.string(),
  /** Comparison operator */
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'EXISTS', 'NOT_EXISTS']),
  /** Comparison target value */
  value: z.any().optional(),
});

export type ConditionSchemaType = z.infer<typeof ConditionSchema>;

/**
 * Theme configuration for Custom Messages enabling developer branding overrides.
 */
export const CustomMessageThemeSchema = z.object({
  /** Custom background color (Hex/RGB/HSL/CSS var) */
  backgroundColor: z.string().optional(),
  /** Custom border color */
  borderColor: z.string().optional(),
  /** Primary text color override */
  textColor: z.string().optional(),
  /** Accent / Brand highlight color */
  accentColor: z.string().optional(),
  /** Custom CSS class names applied to the container */
  className: z.string().optional(),
});

export type CustomMessageTheme = z.infer<typeof CustomMessageThemeSchema>;

/**
 * A Node is the recursive structural building block of custom message UI components.
 */
export type MessageNode = {
  /** The type identifier of the component (e.g., 'Layout.Card', 'Display.Field', 'Input.Text', 'Data.Stat') */
  type: string;
  /** Unique identifier for the node (required for form inputs to track state & validation) */
  id?: string;
  /** Key-value pairs for component properties and props configuration */
  properties?: Record<string, any>;
  /** Nested child nodes rendered inside this node */
  children?: MessageNode[];
  /** Optional conditional display logic evaluating visibility based on form state or message data */
  condition?: ConditionSchemaType;
  /** Optional validation rules for user inputs */
  validation?: ValidationSchemaType;
  /** Optional developer-defined metadata associated with this node */
  metadata?: Record<string, any>;
};

// Zod Schema for recursive MessageNode
export const MessageNodeSchema: z.ZodType<MessageNode> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    id: z.string().optional(),
    properties: z.record(z.string(), z.any()).optional(),
    children: z.array(MessageNodeSchema).optional(),
    condition: ConditionSchema.optional(),
    validation: ValidationSchema.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
);

/**
 * Predefined Custom Message Types supported out of the box.
 */
export const PredefinedCustomMessageTypeSchema = z.enum([
  'APPROVAL',
  'REPORT',
  'FORM',
  'FEEDBACK',
  'TASK_CARD',
  'SURVEY',
  'GENERIC',
]);

export type PredefinedCustomMessageType = z.infer<typeof PredefinedCustomMessageTypeSchema>;

/**
 * Action item schema for interactive buttons rendered on custom messages.
 */
export const MessageActionSchema = z.object({
  /** Unique action identifier */
  id: z.string(),
  /** Button text label */
  label: z.string(),
  /** Visual variant of the button */
  type: z.enum(['PRIMARY', 'SECONDARY', 'DESTRUCTIVE', 'GHOST']).default('SECONDARY'),
  /** Name of the icon (from Lucide icons library) to render on the button */
  icon: z.string().optional(),
  /** Handler configuration specifying what happens when the action button is clicked */
  handler: z.object({
    /** Action handler type: CALLBACK (sends payload back), LINK (navigates), MODAL (opens modal) */
    type: z.enum(['CALLBACK', 'LINK', 'MODAL']),
    /** Target URL for LINK type actions */
    url: z.string().optional(),
    /** Callback ID for CALLBACK type actions */
    callbackId: z.string().optional(),
    /** Custom key-value payload sent back with the callback */
    payload: z.record(z.string(), z.any()).optional(),
    /** Whether to automatically gather and send all current form input state in the callback payload */
    includeFormState: z.boolean().default(true).optional(),
  }),
  /** Optional visibility condition for displaying this action button */
  condition: ConditionSchema.optional(),
});

export type MessageAction = z.infer<typeof MessageActionSchema>;

/**
 * Root Custom Message Schema defining full metadata structures for dynamic & customized UI rendering.
 */
export const CustomMessageSchema = z.object({
  /** Schema version string (e.g. "v1") */
  version: z.string().default('v1'),
  /** Optional template identifier reference */
  templateId: z.string().optional(),
  /** The logical message category type (e.g. 'APPROVAL', 'REPORT', 'FORM', 'FEEDBACK', 'TASK_CARD', 'SURVEY', or custom string) */
  type: z.string(),
  /** Top-level configuration, branding, and header context */
  context: z.object({
    /** Main title displayed on the message header */
    title: z.string().min(1),
    /** Optional subtitle or description */
    description: z.string().optional(),
    /** Lucide icon name for the message header */
    icon: z.string().optional(),
    /** Accent color override for header or priority elements */
    color: z.string().optional(),
    /** Priority indicator badge level */
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  }),
  /** Theme styling configuration for developer customization */
  theme: CustomMessageThemeSchema.optional(),
  /** Hierarchical node tree defining the layout and components */
  root: MessageNodeSchema,
  /** Interactive action buttons attached to the message */
  actions: z.array(MessageActionSchema).optional(),
  /** Data dictionary used for variable interpolation (e.g., `{{user.name}}`) and logic */
  data: z.record(z.string(), z.any()).optional(),
  /** Target restrictions and permissions constraints */
  constraints: z
    .object({
      /** Restrict interactability to specific user IDs */
      targetUsers: z.array(z.string()).optional(),
      /** Required user roles/permissions to execute actions */
      requiresPermissions: z.array(z.string()).optional(),
      /** ISO expiration timestamp after which actions become disabled */
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
});

export type CustomMessage = z.infer<typeof CustomMessageSchema>;

// --- Helper Functions / Builders for Predefined Custom Message Schemas ---

/**
 * Builder options for creating an Approval custom message schema.
 */
export interface CreateApprovalMessageOptions {
  title: string;
  description?: string;
  fields: Array<{ label: string; value: string }>;
  callbackId: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  approveLabel?: string;
  rejectLabel?: string;
  data?: Record<string, any>;
  theme?: CustomMessageTheme;
}

/**
 * Creates a standard Approval Custom Message schema structure.
 *
 * @example
 * ```ts
 * const approvalSchema = createApprovalMessage({
 *   title: 'Expense Reimbursement Request',
 *   description: 'Requested by Jane Doe for $450.00',
 *   fields: [
 *     { label: 'Category', value: 'Travel' },
 *     { label: 'Amount', value: '$450.00' }
 *   ],
 *   callbackId: 'expense-approval-101'
 * });
 * ```
 */
export const createApprovalMessage = (options: CreateApprovalMessageOptions): CustomMessage => ({
  version: 'v1',
  type: 'APPROVAL',
  context: {
    title: options.title,
    description: options.description,
    icon: 'CheckSquare',
    priority: options.priority || 'normal',
  },
  theme: options.theme,
  root: {
    type: 'Layout.Card',
    children: [
      {
        type: 'Layout.Grid',
        properties: { columns: 2 },
        children: options.fields.map(f => ({
          type: 'Display.Field',
          properties: { label: f.label, value: f.value },
        })),
      },
    ],
  },
  actions: [
    {
      id: 'approve',
      label: options.approveLabel || 'Approve',
      type: 'PRIMARY',
      icon: 'Check',
      handler: {
        type: 'CALLBACK',
        callbackId: options.callbackId,
        payload: { action: 'approve' },
        includeFormState: true,
      },
    },
    {
      id: 'reject',
      label: options.rejectLabel || 'Reject',
      type: 'DESTRUCTIVE',
      icon: 'X',
      handler: {
        type: 'CALLBACK',
        callbackId: options.callbackId,
        payload: { action: 'reject' },
        includeFormState: true,
      },
    },
  ],
  data: options.data,
});

/**
 * Builder options for creating a Report custom message schema.
 */
export interface CreateReportMessageOptions {
  title: string;
  reportId: string;
  summary: string;
  metrics: Array<{ label: string; value: string | number }>;
  viewReportUrl?: string;
  data?: Record<string, any>;
  theme?: CustomMessageTheme;
}

/**
 * Creates a standard Report Custom Message schema structure.
 */
export const createReportMessage = (options: CreateReportMessageOptions): CustomMessage => ({
  version: 'v1',
  type: 'REPORT',
  context: {
    title: options.title,
    icon: 'BarChart',
    priority: 'normal',
  },
  theme: options.theme,
  root: {
    type: 'Layout.Stack',
    children: [
      {
        type: 'Text.Paragraph',
        properties: { content: options.summary },
      },
      {
        type: 'Data.StatsGrid',
        children: options.metrics.map(m => ({
          type: 'Data.Stat',
          properties: { label: m.label, value: m.value },
        })),
      },
    ],
  },
  actions: [
    {
      id: 'view_details',
      label: 'View Full Report',
      type: 'SECONDARY',
      icon: 'ExternalLink',
      handler: {
        type: 'LINK',
        url: options.viewReportUrl || `/reports/${options.reportId}`,
      },
    },
  ],
  data: options.data,
});

/**
 * Input field definition for generic Form and Feedback custom messages.
 */
export interface FormFieldConfig {
  id: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
}

/**
 * Builder options for creating an interactive Form or Feedback custom message schema.
 */
export interface CreateFormMessageOptions {
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  submitCallbackId: string;
  submitLabel?: string;
  type?: 'FORM' | 'FEEDBACK' | 'SURVEY';
  data?: Record<string, any>;
  theme?: CustomMessageTheme;
}

/**
 * Creates an interactive Form / Survey / Feedback Custom Message schema structure.
 */
export const createFormMessage = (options: CreateFormMessageOptions): CustomMessage => ({
  version: 'v1',
  type: options.type || 'FORM',
  context: {
    title: options.title,
    description: options.description,
    icon: options.type === 'FEEDBACK' ? 'HelpCircle' : 'FileText',
    priority: 'normal',
  },
  theme: options.theme,
  root: {
    type: 'Layout.Stack',
    children: options.fields.map(field => {
      const nodeType =
        field.type === 'select'
          ? 'Input.Select'
          : field.type === 'checkbox'
            ? 'Input.Checkbox'
            : 'Input.Text';

      const validation: ValidationSchemaType | undefined = field.required
        ? { required: true, errorMessage: `${field.label} is required` }
        : undefined;

      const properties: Record<string, any> = {
        label: field.label,
        placeholder: field.placeholder,
      };

      if (field.type === 'textarea') {
        properties.multiline = true;
      }

      if (field.type === 'select' && field.options) {
        properties.dataSource = {
          type: 'STATIC',
          items: field.options,
        };
      }

      return {
        type: nodeType,
        id: field.id,
        properties,
        validation,
      };
    }),
  },
  actions: [
    {
      id: 'submit',
      label: options.submitLabel || 'Submit',
      type: 'PRIMARY',
      icon: 'Send',
      handler: {
        type: 'CALLBACK',
        callbackId: options.submitCallbackId,
        payload: { action: 'submit' },
        includeFormState: true,
      },
    },
  ],
  data: options.data,
});

/**
 * Builder options for creating a Task Card custom message schema.
 */
export interface CreateTaskCardMessageOptions {
  title: string;
  description?: string;
  status: string;
  assignee?: string;
  dueDate?: string;
  callbackId: string;
  data?: Record<string, any>;
  theme?: CustomMessageTheme;
}

/**
 * Creates a Task Card Custom Message schema structure.
 */
export const createTaskCardMessage = (options: CreateTaskCardMessageOptions): CustomMessage => ({
  version: 'v1',
  type: 'TASK_CARD',
  context: {
    title: options.title,
    description: options.description,
    icon: 'CheckSquare',
    priority: 'normal',
  },
  theme: options.theme,
  root: {
    type: 'Layout.Stack',
    children: [
      {
        type: 'Layout.Grid',
        properties: { columns: 3 },
        children: [
          { type: 'Display.Field', properties: { label: 'Status', value: options.status } },
          { type: 'Display.Field', properties: { label: 'Assignee', value: options.assignee || 'Unassigned' } },
          { type: 'Display.Field', properties: { label: 'Due Date', value: options.dueDate || 'None' } },
        ],
      },
    ],
  },
  actions: [
    {
      id: 'complete_task',
      label: 'Mark Completed',
      type: 'PRIMARY',
      icon: 'Check',
      handler: {
        type: 'CALLBACK',
        callbackId: options.callbackId,
        payload: { action: 'complete' },
        includeFormState: false,
      },
    },
  ],
  data: options.data,
});
