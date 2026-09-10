# Custom Messages (v1) & Schema Reference

Scrymechat's Custom Message system allows you to build rich, interactive, and dynamic user interfaces directly within the chat. Inspired by GraphQL and Block-based UI systems, it provides an "enterprise-grade" way to extend chat functionality.

Custom messages are validated using `CustomMessageSchema` in `@repo/shared` and `@scryme/chat`, enabling strict type safety, node-based component rendering, form validation, and automated webhook callbacks.

## Core Concepts

- **Node-based Architecture**: UI is built from nested nodes (Layouts, Inputs, Displays).
- **Form State**: Messages automatically track input state and submit it with actions.
- **Dynamic Content**: Support for variable interpolation `{{var}}` and dynamic data sources.
- **Conditional Logic**: Show or hide components and actions based on user input or data.
- **Plugin Registry**: Easily extensible component system.
- **Client-side Validation**: Define rules to ensure data quality before submission.

---

## Schema Overview

A custom message can be created via the V3 API `POST /v3/workspaces/:slug/channels/:channelId/messages/custom` endpoint or included in `metadata.customMessage`.

```json
{
  "version": "v1",
  "type": "APPROVAL",
  "context": {
    "title": "Expense Reimbursement Request",
    "description": "Submitted by Jane Doe for $450.00",
    "icon": "CheckSquare",
    "priority": "urgent"
  },
  "theme": {
    "accentColor": "#6366f1",
    "backgroundColor": "#1e1e2e"
  },
  "root": {
    "type": "Layout.Card",
    "children": [
      {
        "type": "Layout.Grid",
        "properties": { "columns": 2 },
        "children": [
          { "type": "Display.Field", "properties": { "label": "Category", "value": "Travel" } },
          { "type": "Display.Field", "properties": { "label": "Amount", "value": "$450.00" } }
        ]
      }
    ]
  },
  "actions": [
    {
      "id": "approve",
      "label": "Approve",
      "type": "PRIMARY",
      "icon": "Check",
      "handler": {
        "type": "CALLBACK",
        "callbackId": "expense-approval-101",
        "payload": { "action": "approve" },
        "includeFormState": true
      }
    },
    {
      "id": "reject",
      "label": "Reject",
      "type": "DESTRUCTIVE",
      "icon": "X",
      "handler": {
        "type": "CALLBACK",
        "callbackId": "expense-approval-101",
        "payload": { "action": "reject" },
        "includeFormState": true
      }
    }
  ],
  "data": {
    "claimId": "EXP-101"
  }
}
```

### Context Object
Defines header branding and contextual details:
- `title`: (Required) The main card header text.
- `description`: (Optional) Secondary subtitle or explanation.
- `icon`: (Optional) Lucide icon name (e.g. `CheckSquare`, `FileText`, `BarChart`).
- `color`: (Optional) Hex or CSS color string for priority accent.
- `priority`: Priority badge level (`low`, `normal`, `high`, `urgent`).

### Variables & Interpolation
You can use `{{variable.path}}` in most string properties. Variables are resolved from the `data` object and the current `formState`.

Example:
```json
"data": { "user": { "name": "Jules" } },
"root": {
  "type": "Text.Heading",
  "properties": { "content": "Hello, {{user.name}}!" }
}
```

---

## Components

### Layout Components

#### `Layout.Card`
A contained box with padding and a border.
- `properties.className`: Custom CSS classes.

#### `Layout.Stack`
A vertical flex container.
- `properties.className`: Custom CSS classes.

#### `Layout.Grid`
A multi-column grid.
- `properties.columns`: Number of columns (default 1).

### Display Components

#### `Text.Heading` & `Text.Paragraph`
Basic text elements. Supports markdown in paragraphs.
- `properties.content`: The text to display.

#### `Display.Field`
A labeled data point.
- `properties.label`: The field label.
- `properties.value`: The field value.

#### `Data.StatsGrid` & `Data.Stat`
Used for dashboard-like metrics.

### Input Components

All inputs require an `id` to track their value and can optionally include `validation`.

#### `Input.Text`
Single or multi-line text input.
- `properties.label`: Field label.
- `properties.placeholder`: Placeholder text.
- `properties.multiline`: Boolean for textarea.
- `properties.inputType`: `text`, `number`, `email`, `password`.

#### `Input.Select`
A dropdown selection.
- `properties.dataSource`: Defines where options come from.
  - `type`: `STATIC`, `API`, or `VARIABLE`.
  - `items`: Array of `{ label, value }` (for STATIC).
  - `url`: API endpoint (for API).
  - `key`: Key in `data` object (for VARIABLE).

#### `Input.Checkbox`
A simple toggle.
- `properties.label`: Label text.

---

## Logic, Validation & Actions

### Validation
Inputs can define a `validation` object:
- `required`: Boolean.
- `pattern`: Regex string.
- `minLength` / `maxLength`: Numbers.
- `errorMessage`: Custom string to show on failure.

```json
"validation": {
  "required": true,
  "errorMessage": "Please provide your feedback"
}
```

### Conditional Visibility
Every node can have a `condition`.

```json
"condition": {
  "field": "is_interested",
  "operator": "EQUALS",
  "value": true
}
```
**Operators**: `EQUALS`, `NOT_EQUALS`, `CONTAINS`, `GREATER_THAN`, `LESS_THAN`, `EXISTS`, `NOT_EXISTS`.

### Actions & Webhook Callbacks
Actions are rendered as interactive buttons at the bottom of the card.

```json
{
  "id": "submit_action",
  "label": "Submit Feedback",
  "type": "PRIMARY",
  "handler": {
    "type": "CALLBACK",
    "callbackId": "feedback-plugin-id",
    "includeFormState": true,
    "payload": { "category": "user-experience" }
  }
}
```

## Schema Builders

For TypeScript and SDK developers (`@repo/shared` or `@scryme/chat`), pre-built message generators facilitate type-safe card creation:

### 1. `createApprovalMessage`
Generates a standard two-action approval card:
```typescript
import { createApprovalMessage } from '@scryme/chat';

const approval = createApprovalMessage({
  title: 'Expense Reimbursement',
  description: 'Requested by Jane Doe',
  fields: [
    { label: 'Category', value: 'Travel' },
    { label: 'Amount', value: '$450.00' }
  ],
  callbackId: 'expense-auth-99'
});
```

### 2. `createFormMessage`
Generates interactive forms, surveys, or feedback collection cards:
```typescript
import { createFormMessage } from '@scryme/chat';

const form = createFormMessage({
  title: 'Quarterly Survey',
  description: 'Tell us how we are doing',
  fields: [
    { id: 'rating', label: 'Satisfaction Score (1-5)', type: 'text', required: true },
    { id: 'feedback', label: 'Comments', type: 'textarea' }
  ],
  submitCallbackId: 'survey-collector-v1'
});
```

---

## Response Execution & Webhook Pipeline

1. **User Action**: When a user clicks an action button or submits a form, client-side input validation runs automatically.
2. **V3 API Submission**: The client dispatches a `POST /v3/workspaces/:slug/channels/:channelId/messages/:messageId/actions` request containing `actionId`, optional `comment`, and form state.
3. **Database Persistence**: Scrymechat records the response in `MessageActionResponse` linked to the user and message.
4. **Callback Webhook Dispatch**: If `callbackUrl` is present in message metadata or action handler, an HTTP POST request with HMAC SHA-256 signature (`X-Webhook-Signature`) is sent to your webhook endpoint.
5. **Workspace Event Broadcast**: A `message.action_response` event is dispatched to all workspace webhooks registered for the event.
6. **Real-time Broadcast**: The `message.action_response` event is published over Ably / WebSockets for live UI updates across connected clients.

---

## Example: Advanced Approval Form

```json
{
  "version": "v1",
  "type": "APPROVAL",
  "context": {
    "title": "Expense Claim: {{claim_id}}",
    "icon": "FileText"
  },
  "root": {
    "type": "Layout.Stack",
    "children": [
      {
        "type": "Display.Field",
        "properties": { "label": "Amount", "value": "${{amount}}" }
      },
      {
        "id": "reason",
        "type": "Input.Select",
        "validation": { "required": true },
        "properties": {
          "label": "Rejection Reason",
          "dataSource": {
            "type": "STATIC",
            "items": [
              { "label": "Missing Receipt", "value": "no_receipt" },
              { "label": "Policy Violation", "value": "policy" }
            ]
          }
        },
        "condition": { "field": "action_type", "operator": "EQUALS", "value": "reject" }
      }
    ]
  },
  "actions": [
    {
      "id": "approve",
      "label": "Approve",
      "type": "PRIMARY",
      "handler": { "type": "CALLBACK", "callbackId": "expense-auth" }
    },
    {
      "id": "reject",
      "label": "Reject",
      "type": "DESTRUCTIVE",
      "handler": { "type": "CALLBACK", "callbackId": "expense-auth" }
    }
  ],
  "data": {
    "claim_id": "EXP-992",
    "amount": "450.00"
  }
}
```
