# Workspace Messaging API Documentation

Send messages to workspace channels with support for simple text, rich interactive layouts, reports, approvals, code snippets, and more.

## Base Configuration

**Base URL:** `https://api.yourdomain.com`  
**Endpoint:** `POST /api/v1/messages`  
**Content-Type:** `application/json`

## Authentication

Include your Workspace API Key in the request headers using either format:

```http
Authorization: Bearer <YOUR_WORKSPACE_API_KEY>
```

or

```http
x-workspace-api-key: <YOUR_WORKSPACE_API_KEY>
```

## Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| channelId | string | Yes | Unique identifier of the target channel |
| content | string | Yes | Fallback text content (max 10,000 characters) |
| messageType | string | No | Message type. Default: `custom`<br/>Options: `text`, `custom`, `code`, `report`, `approval-request`, `comment-request`, `system` |
| metadata | object | No | Type-specific message data |
| actions | array | No | Interactive buttons (see [Actions](#actions)) |
| attachments | array | No | File attachments (see [Attachments](#attachments)) |

## Message Types

### 1. Text Message

Simple plain text notification.

```json
{
  "channelId": "chan_123456789",
  "content": "Hello team, this is a simple text message.",
  "messageType": "text"
}
```

### 2. Custom Message

Build complex layouts with headers, fields, grids, and lists.

**Metadata Schema:**

| Field | Type | Description |
|-------|------|-------------|
| layout | string | `card`, `inline`, `modal`, or `banner` |
| title | string | Message title |
| description | string | Subtitle or description |
| theme | object | `{ variant: "default" \| "info" \| "warning" \| "destructive" \| "success" }` |
| sections | array | UI sections (grid, field, divider, list) |

**Example:**

```json
{
  "channelId": "chan_123456789",
  "content": "New Customer Signup",
  "messageType": "custom",
  "metadata": {
    "layout": "card",
    "title": "New Customer Signup",
    "description": "A new enterprise customer has just registered.",
    "theme": { "variant": "info" },
    "sections": [
      {
        "type": "grid",
        "columns": 2,
        "fields": [
          { "name": "company", "label": "Company", "type": "text", "value": "Acme Corp" },
          { "name": "plan", "label": "Plan", "type": "badge", "value": "Enterprise" }
        ]
      },
      { "type": "divider" },
      {
        "type": "field",
        "fields": [
          { "name": "email", "label": "Contact Email", "type": "text", "value": "admin@acme.com" }
        ]
      }
    ]
  }
}
```

### 3. Report Message

Financial summaries, analytics, status reports, or audits.

**Metadata Schema:**

| Field | Type | Description |
|-------|------|-------------|
| title | string | Report title |
| type | string | `financial`, `analytics`, `status`, or `audit` |
| status | string | `draft`, `final`, `review`, or `archived` |
| date | string | Report date (ISO 8601) |
| summary | string | Main summary text |
| kpis | array | Key Performance Indicators |
| sections | array | Tables or text content sections |

**Example:**

```json
{
  "channelId": "chan_123456789",
  "content": "Q3 Financial Overview",
  "messageType": "report",
  "metadata": {
    "title": "Q3 Financial Overview",
    "type": "financial",
    "status": "final",
    "date": "2024-10-01",
    "summary": "Revenue exceeded expectations by 15% due to new enterprise deals.",
    "kpis": [
      {
        "label": "Total Revenue",
        "value": "$125,000",
        "change": 15,
        "trend": "up",
        "intent": "positive"
      },
      {
        "label": "Churn Rate",
        "value": "2.1%",
        "change": -0.5,
        "trend": "down",
        "intent": "positive"
      }
    ],
    "sections": [
      {
        "title": "Revenue Breakdown",
        "table": {
          "headers": ["Source", "Amount", "Share"],
          "rows": [
            ["Subscriptions", "$100,000", "80%"],
            ["Services", "$25,000", "20%"]
          ]
        }
      }
    ]
  }
}
```

### 4. Code Message

Display syntax-highlighted code snippets.

**Metadata Schema:**

| Field | Type | Description |
|-------|------|-------------|
| language | string | Programming language (e.g., `typescript`, `python`, `json`) |
| fileName | string | Optional file name |

**Example:**

```json
{
  "channelId": "chan_123456789",
  "content": "const sum = (a, b) => a + b;",
  "messageType": "code",
  "metadata": {
    "language": "javascript",
    "fileName": "utils.js"
  }
}
```

### 5. Approval Request

Initiate an approval workflow.

**Metadata Schema:**

| Field | Type | Description |
|-------|------|-------------|
| approvalStatus | string | `pending`, `approved`, or `rejected` (default: `pending`) |

**Example:**

```json
{
  "channelId": "chan_123456789",
  "content": "Deployment Request to Production",
  "messageType": "approval-request",
  "metadata": {
    "approvalStatus": "pending"
  },
  "actions": [
    { "actionId": "approve", "label": "Approve", "style": "primary", "value": "approved" },
    { "actionId": "reject", "label": "Reject", "style": "danger", "value": "rejected" }
  ]
}
```

### 6. Comment Request

Solicit feedback on a resource (document, design, code).

**Metadata Schema:**

| Field | Type | Description |
|-------|------|-------------|
| status | string | `open`, `resolved`, or `closed` |
| resource | object | Resource details (see below) |

**Resource Object:**

| Field | Type | Description |
|-------|------|-------------|
| title | string | Resource title |
| type | string | `document`, `image`, `code`, or `link` |
| url | string | Resource URL |
| fileSize | string | Optional file size |

**Example:**

```json
{
  "channelId": "chan_123456789",
  "content": "Please review the new landing page design.",
  "messageType": "comment-request",
  "metadata": {
    "status": "open",
    "resource": {
      "title": "Homepage Design V2",
      "type": "image",
      "url": "https://cdn.example.com/design-v2.png",
      "fileSize": "2.4 MB"
    }
  }
}
```

## Interactive Elements

### Actions

Add interactive buttons to any message type.

| Field | Type | Description |
|-------|------|-------------|
| actionId | string | Unique action identifier |
| label | string | Button text |
| style | string | `default`, `primary`, or `danger` |
| value | string | Optional value returned when clicked |
| disabled | boolean | Whether the button is disabled |

**Example:**

```json
"actions": [
  { "actionId": "view_details", "label": "View Details", "style": "default" },
  { "actionId": "delete_item", "label": "Delete", "style": "danger" }
]
```

### Attachments

Attach files to any message.

| Field | Type | Description |
|-------|------|-------------|
| name | string | File name |
| type | string | MIME type |
| url | string | File URL |
| size | number | File size in bytes |

**Example:**

```json
"attachments": [
  {
    "name": "invoice_1024.pdf",
    "type": "application/pdf",
    "url": "https://cdn.example.com/invoices/1024.pdf",
    "size": 102400
  }
]
```

## Handling Action Clicks (Webhooks)

When a user clicks an action button, a POST request is sent to your configured Interaction Webhook URL.

**Webhook Payload:**

```json
{
  "type": "block_action",
  "user": {
    "id": "user_98765",
    "name": "Jane Doe"
  },
  "channelId": "chan_123456789",
  "messageId": "msg_ck82...",
  "action": {
    "actionId": "approve",
    "value": "approved",
    "timestamp": "2024-01-01T12:05:00Z"
  }
}
```

**Expected Response:**

Respond with `200 OK` to acknowledge receipt. Optionally return JSON to update the original message.

## API Responses

### Success (201 Created)

```json
{
  "success": true,
  "message": {
    "id": "msg_ck82...",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### Error (400 Bad Request)

```json
{
  "error": "Invalid request body",
  "code": "INVALID_REQUEST_BODY",
  "details": [
    { "path": ["channelId"], "message": "Required" }
  ]
}
```

## Advanced Customization

The custom message type is a powerful form engine. Beyond simple layouts, it supports input validation, conditional logic, and interactive form elements.

### 1. Advanced Field Types

The fields array supports specific input types for capturing user data.

| Type | Description |
|------|-------------|
| text | Single-line text input |
| number | Numeric input |
| textarea | Multi-line text input |
| password | Masked text input |
| date | Date picker |
| switch | Toggle switch (boolean) |
| checkbox | Checkbox (boolean) |
| select | Dropdown menu (requires options map) |
| progress | Visual progress bar (0-100) |
| image | Image display (requires value as URL) |
| code | Code block with syntax highlighting |

**Example: Dropdown & Date Picker**

```json
{
  "type": "custom",
  "metadata": {
    "sections": [
      {
        "type": "body",
        "fields": [
          {
            "name": "priority",
            "label": "Select Priority",
            "type": "select",
            "options": {
              "low": "Low Priority",
              "high": "High Priority"
            },
            "value": "low",
            "editable": true
          },
          {
            "name": "due_date",
            "label": "Due Date",
            "type": "date",
            "editable": true
          }
        ]
      }
    ]
  }
}
```

### 2. Form Validation

You can enforce data integrity before an action (like "Submit") can be clicked. Use the validation object on fields and `requiresValidation: true` on actions.

- **required:** (boolean) Field must have a value.
- **pattern:** (string) Regex pattern the value must match.
- **message:** (string) Error message shown if validation fails.

```json
{
  "type": "text",
  "name": "email_address",
  "label": "Contact Email",
  "required": true,
  "validation": {
    "pattern": "^\\S+@\\S+\\.\\S+$",
    "message": "Please enter a valid email address."
  },
  "editable": true
}
```

### 3. Conditional Rendering

Fields or entire sections can be hidden/shown dynamically based on the value of other fields using the condition object.

- **field:** The name of the field to watch.
- **operator:** `equals`, `notEquals`, `contains`, `greaterThan`, `lessThan`.
- **value:** The value to compare against.

**Example: Show "Reason" only if "Reject" is selected**

```json
[
  {
    "name": "status",
    "type": "select",
    "options": { "approve": "Approve", "reject": "Reject" },
    "editable": true
  },
  {
    "name": "rejection_reason",
    "type": "textarea",
    "label": "Reason for Rejection",
    "editable": true,
    "condition": {
      "field": "status",
      "operator": "equals",
      "value": "reject"
    }
  }
]
```

### 4. Available Icons

Icons can be used in actions or section headers. Refer to them by name string:

`alert-circle`, `check`, `x`, `info`, `send`, `trash`, `edit`, `calendar`, `user`, `more`, `lock`, `eye`, `eye-off`, `terminal`, `copy`, `loader`

### 5. Section Layouts

While `grid` and `field` are common, you can use specialized section types for better formatting:

- **header:** Large bold text, useful for titles.
- **body:** Standard container with spacing for text/fields.
- **footer:** Small text with an info icon, useful for disclaimers or timestamps.

```json
{
  "type": "footer",
  "content": "This report was generated automatically by the CI/CD pipeline."
}
```