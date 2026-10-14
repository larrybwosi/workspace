# Custom Messages (v1) & UI Schema Reference

Scrymechat's Custom Message system provides a structured, JSON-driven component framework for building rich, interactive, and customized user interfaces directly within chat channels and direct messages. Inspired by block-based UI engines and component trees, it enables automated bots, internal tooling, and external service integrations to present dynamic cards, interactive forms, live metrics, and multi-step workflows.

Custom message payloads are strictly validated using `CustomMessageSchema` in `@repo/shared` and `@scryme/chat`, enabling client-side rendering, form state management, automated input validation, conditional component visibility, and signed webhook callbacks.

---

## Architectural Overview & Flow

When an external system or bot sends a custom message, Scrymechat processes the payload through a structured pipeline:

```
+------------------+         1. POST /v3/.../messages/custom         +-------------------+
|  External System | ----------------------------------------------> |   Scrymechat V3   |
|   / Integration  |                                                 |    API Gateway    |
+------------------+                                                 +-------------------+
         ^                                                                     |
         |                                                                     | 2. Persist & Broadcast
         |                                                                     v
         |                                                           +-------------------+
         |                                                           | Scrymechat Client |
         |                                                           | (Web / Mobile)    |
         |                                                           +-------------------+
         |                                                                     |
         |                                                                     | 3. User Interacts
         |                                                                     |    (Inputs & Buttons)
         |                                                                     v
         | 5. Signed HTTP Webhook Dispatch                           +-------------------+
         +---------------------------------------------------------- |  V3 Actions API   |
            (X-Webhook-Signature & Form State)                       |  /messages/action |
                                                                     +-------------------+
```

### Key Capabilities
- **Node-Based Component Tree**: UI layouts are built from nested structural nodes (`Layout`), information displays (`Display`, `Text`, `Data`), and form controls (`Input`).
- **Dynamic Variable Interpolation**: Bind text and data using Mustache-style `{{data.key}}` or `{{formState.key}}` template tags.
- **Form State Collection**: Inputs automatically capture user selections and submit consolidated state along with action button clicks.
- **Theme & Branding Customization**: Custom accent colors, background overrides, and button styling allow messages to match host system branding.
- **Conditional Visibility Logic**: Dynamically show or hide components or actions based on evaluate rules (`EQUALS`, `CONTAINS`, `EXISTS`, etc.).
- **Client-side Validation**: Enforce required fields, string length constraints, and regex pattern matching prior to form submission.

---

## Root Schema Reference (`CustomMessageSchema`)

The top-level `CustomMessageSchema` defines the structure of a custom message payload:

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `version` | `string` | No | `"v1"` | Schema version identifier. |
| `templateId` | `string` | No | - | Optional template reference ID for cached UI presets. |
| `type` | `string` | Yes | - | Logical category (e.g., `'APPROVAL'`, `'REPORT'`, `'FORM'`, `'FEEDBACK'`, `'TASK_CARD'`, `'SURVEY'`). |
| `context` | `ContextObject` | Yes | - | Card header configuration, title, icon, and priority badge. |
| `theme` | `CustomMessageTheme` | No | - | Custom theme color overrides for card styling. |
| `root` | `MessageNode` | Yes | - | Top-level layout node containing child components. |
| `actions` | `MessageAction[]` | No | - | Array of interactive action buttons at the base of the message card. |
| `data` | `Record<string, any>` | No | - | Key-value dictionary used for variable interpolation and conditional logic evaluation. |
| `constraints` | `ConstraintsObject` | No | - | Target user restrictions, required permissions, or expiration timeouts. |

### Context Object (`context`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Yes | Main header text for the card. Supports variable interpolation. |
| `description` | `string` | No | Subtitle or context description. |
| `icon` | `string` | No | Lucide icon identifier (e.g. `CheckSquare`, `FileText`, `BarChart`, `Rocket`). |
| `color` | `string` | No | Color string (hex or CSS) used for header accents. |
| `priority` | `enum` | No | Priority level badge: `'low'`, `'normal'`, `'high'`, `'urgent'`. Default: `'normal'`. |

### Constraints Object (`constraints`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `targetUsers` | `string[]` | No | Array of user IDs authorized to interact with the message. |
| `requiresPermissions` | `string[]` | No | Array of required workspace permission keys. |
| `expiresAt` | `string` (ISO 8601) | No | Timestamp after which actions become disabled in the UI. |

---

## Theme Customization (`CustomMessageTheme`)

Custom messages allow full visual customization to align cards with your organization's design system or external product branding.

| Property | Type | Description |
| :--- | :--- | :--- |
| `accentColor` | `string` | Hex color for border accents, focus rings, and primary highlights (e.g., `"#6366f1"`). |
| `backgroundColor` | `string` | Overall card background fill (e.g., `"#18181b"` or `"#ffffff"`). |
| `textColor` | `string` | Primary text color override (e.g., `"#f4f4f5"`). |
| `cardBackgroundColor` | `string` | Inner component box background color. |
| `borderColor` | `string` | Border stroke color (e.g., `"#27272a"`). |
| `primaryButtonColor` | `string` | Fill color for `PRIMARY` action buttons. |

### Theme Example JSON
```json
"theme": {
  "accentColor": "#10b981",
  "backgroundColor": "#0f172a",
  "textColor": "#f8fafc",
  "cardBackgroundColor": "#1e293b",
  "borderColor": "#334155",
  "primaryButtonColor": "#059669"
}
```

---

## Component Hierarchy & Node Types

Messages are structured as trees of `MessageNode` elements. Each node specifies a `type`, optional `id`, `properties`, `children`, `validation`, and `condition`.

### 1. Layout Components

Layout components define structural placement and flex/grid alignment.

#### `Layout.Card`
A bordered, rounded container card with padding.
- `properties.className`: Optional custom CSS helper classes.
- `children`: Array of nested `MessageNode` items.

#### `Layout.Stack`
A vertical stack container.
- `properties.className`: Optional custom CSS helper classes.
- `children`: Array of nested `MessageNode` items.

#### `Layout.Grid`
A multi-column grid layout.
- `properties.columns`: Number of columns (1 to 12). Default: `1`.
- `children`: Array of grid items.

---

### 2. Display Components

Display components present static or interpolated text and metadata.

#### `Text.Heading` & `Text.Paragraph`
- `properties.content`: Text content. Supports Markdown (bold, links, code) and Mustache interpolation (`{{data.fieldName}}`).

#### `Display.Field`
Key-value pair layout for formatted data fields.
- `properties.label`: Field title label.
- `properties.value`: Value string or interpolated variable.

#### `Data.StatsGrid` & `Data.Stat`
Grid display for key metrics and analytical summary data.
- `properties.label`: Metric label.
- `properties.value`: Metric value.

---

### 3. Input Components

Input components capture user input. All inputs require a unique `id` property. Captured values are stored in the message's `formState` object under their `id`.

#### `Input.Text`
Single-line or multi-line text input field.
- `id`: Unique string identifier (e.g., `"user_feedback"`).
- `properties.label`: Field label text.
- `properties.placeholder`: Optional placeholder text.
- `properties.multiline`: Boolean (`true` renders a textarea).
- `properties.inputType`: Input subtype (`"text"`, `"number"`, `"email"`, `"password"`).

#### `Input.Select`
Dropdown selection field.
- `id`: Unique identifier.
- `properties.label`: Field label.
- `properties.dataSource`: Data source provider configuration:
  - `type`: `"STATIC"`, `"API"`, or `"VARIABLE"`.
  - `items`: Array of `{ "label": string, "value": string }` (for `STATIC`).
  - `url`: API endpoint URL returning select options (for `API`).
  - `key`: Key path in `data` dictionary containing option list (for `VARIABLE`).

#### `Input.Checkbox`
Single toggle checkbox.
- `id`: Unique identifier.
- `properties.label`: Checkbox label.

---

## Validation & Conditional Logic Schemas

### Field Validation (`ValidationSchema`)

Input nodes accept a `validation` object enforcing constraints before user action submission:

| Constraint | Type | Description |
| :--- | :--- | :--- |
| `required` | `boolean` | If `true`, input cannot be empty upon action click. |
| `pattern` | `string` | Regex pattern string that input value must match. |
| `minLength` | `number` | Minimum character length required. |
| `maxLength` | `number` | Maximum allowed character length. |
| `errorMessage` | `string` | Custom error message displayed under the input on validation failure. |

```json
"validation": {
  "required": true,
  "minLength": 5,
  "errorMessage": "Please enter at least 5 characters for the justification."
}
```

### Conditional Visibility (`ConditionSchema`)

Any component node or action button can declare a `condition` object to dynamically toggle visibility:

| Property | Type | Description |
| :--- | :--- | :--- |
| `field` | `string` | Key path in `data` or `formState` to evaluate. |
| `operator` | `enum` | Evaluation operator: `EQUALS`, `NOT_EQUALS`, `CONTAINS`, `GREATER_THAN`, `LESS_THAN`, `EXISTS`, `NOT_EXISTS`. |
| `value` | `any` | Comparison target value. |

```json
"condition": {
  "field": "rejection_reason_select",
  "operator": "EQUALS",
  "value": "other"
}
```

---

## Interactive Actions & Webhooks

Actions render as buttons attached to the bottom of the custom message card.

### Action Configuration (`MessageActionSchema`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Unique action identifier (e.g. `"approve"`, `"submit_form"`). |
| `label` | `string` | Yes | Display text for the button. |
| `type` | `enum` | Yes | Style type: `'PRIMARY'`, `'SECONDARY'`, `'DESTRUCTIVE'`. |
| `icon` | `string` | No | Lucide icon name. |
| `handler` | `ActionHandler` | Yes | Handler definition: `type` (`"CALLBACK"` or `"LINK"`). |
| `handler.type` | `enum` | Yes | `'CALLBACK'` dispatches webhook/API action; `'LINK'` opens external URL. |
| `handler.url` | `string` | Conditional | Target URL (required for `'LINK'`). |
| `handler.callbackId` | `string` | Conditional | Identifier sent back with callback payload (required for `'CALLBACK'`). |
| `handler.payload` | `object` | No | Custom static metadata dictionary sent in webhook callback. |
| `handler.includeFormState` | `boolean` | No | If `true` (default), collects and includes all `formState` input values in callback. |
| `allowMultipleResponses` | `boolean` | No | If `true`, users can click action buttons multiple times. Default: `false`. |

---

## TypeScript SDK Builders (`@scryme/chat`)

For TypeScript developers, `@repo/shared` and `@scryme/chat` provide helper builder functions to construct standard card types with full type safety:

### 1. Approval Message Builder (`createApprovalMessage`)

```typescript
import { createApprovalMessage } from '@scryme/chat';

const customMessage = createApprovalMessage({
  title: 'Purchase Order Approval: PO-9921',
  description: 'Requested by Alex Smith',
  priority: 'high',
  fields: [
    { label: 'Vendor', value: 'Acme Cloud Services' },
    { label: 'Total Amount', value: '$12,500.00' }
  ],
  callbackId: 'po-approval-webhook-id',
  approveLabel: 'Approve PO',
  rejectLabel: 'Decline PO'
});
```

### 2. Interactive Form Builder (`createFormMessage`)

```typescript
import { createFormMessage } from '@scryme/chat';

const formMessage = createFormMessage({
  title: 'Customer Feedback Survey',
  description: 'Help us improve product experience',
  type: 'FEEDBACK',
  fields: [
    {
      id: 'satisfaction',
      label: 'Overall Satisfaction',
      type: 'select',
      required: true,
      options: [
        { label: 'Very Satisfied', value: '5' },
        { label: 'Satisfied', value: '4' },
        { label: 'Needs Improvement', value: '2' }
      ]
    },
    {
      id: 'comments',
      label: 'Additional Comments',
      type: 'textarea',
      placeholder: 'Share your thoughts...'
    }
  ],
  submitCallbackId: 'customer-feedback-collector'
});
```

### 3. Report Builder (`createReportMessage`)

```typescript
import { createReportMessage } from '@scryme/chat';

const reportMessage = createReportMessage({
  title: 'Weekly System Performance',
  summary: 'All core microservices maintained 99.99% uptime during peak hours.',
  reportId: 'rep_2026_w36',
  metrics: [
    { label: 'Latency (p99)', value: '42ms' },
    { label: 'Error Rate', value: '0.01%' },
    { label: 'Total Requests', value: '14.2M' }
  ],
  viewReportUrl: 'https://analytics.acme.com/reports/2026-w36'
});
```

### 4. Task Card Builder (`createTaskCardMessage`)

```typescript
import { createTaskCardMessage } from '@scryme/chat';

const taskCard = createTaskCardMessage({
  title: 'Migrate Database Schemas',
  description: 'Apply Prisma v6 migrations to staging cluster.',
  status: 'In Progress',
  assignee: 'DevOps Team',
  dueDate: '2026-09-15',
  callbackId: 'task-complete-event'
});
```

---

## Complete JSON Schema Payload Example

```json
{
  "version": "v1",
  "type": "APPROVAL",
  "context": {
    "title": "Production Release #402",
    "description": "Triggered automatically by GitHub Actions CI/CD",
    "icon": "Rocket",
    "priority": "urgent"
  },
  "theme": {
    "accentColor": "#6366f1",
    "backgroundColor": "#111827",
    "textColor": "#f9fafb",
    "primaryButtonColor": "#4f46e5"
  },
  "root": {
    "type": "Layout.Card",
    "children": [
      {
        "type": "Layout.Grid",
        "properties": { "columns": 2 },
        "children": [
          { "type": "Display.Field", "properties": { "label": "Environment", "value": "Production (us-west-2)" } },
          { "type": "Display.Field", "properties": { "label": "Commit Hash", "value": "a1b2c3d" } }
        ]
      },
      {
        "id": "release_notes_confirm",
        "type": "Input.Checkbox",
        "properties": { "label": "I have reviewed the changelog and verified automated test coverage." },
        "validation": { "required": true, "errorMessage": "You must confirm changelog review before approving." }
      }
    ]
  },
  "actions": [
    {
      "id": "approve_release",
      "label": "Approve Deployment",
      "type": "PRIMARY",
      "icon": "Check",
      "handler": {
        "type": "CALLBACK",
        "callbackId": "deploy-rel-402",
        "payload": { "releaseId": "rel-402" },
        "includeFormState": true
      }
    },
    {
      "id": "cancel_release",
      "label": "Abort Release",
      "type": "DESTRUCTIVE",
      "icon": "X",
      "handler": {
        "type": "CALLBACK",
        "callbackId": "deploy-rel-402",
        "payload": { "action": "abort" }
      }
    }
  ],
  "data": {
    "releaseId": "rel-402"
  }
}
```
