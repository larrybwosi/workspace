# Custom Messages (v1)

Scrymechat's Custom Message system allows you to build rich, interactive, and dynamic user interfaces directly within the chat. Inspired by GraphQL and Block-based UI systems, it provides an "enterprise-grade" way to extend chat functionality.

## Core Concepts

- **Node-based Architecture**: UI is built from nested nodes (Layouts, Inputs, Displays).
- **Form State**: Messages automatically track input state and submit it with actions.
- **Dynamic Content**: Support for variable interpolation `{{var}}` and dynamic data sources.
- **Conditional Logic**: Show or hide components and actions based on user input or data.
- **Plugin Registry**: Easily extensible component system.
- **Client-side Validation**: Define rules to ensure data quality before submission.

---

## Schema Overview

A custom message is defined in the message's `metadata` field.

```json
{
  "version": "v1",
  "type": "SURVEY",
  "context": {
    "title": "Feedback Survey",
    "description": "Tell us what you think",
    "icon": "Info",
    "priority": "normal"
  },
  "root": {
    "type": "Layout.Card",
    "children": [ ... ]
  },
  "actions": [ ... ],
  "data": { ... }
}
```

### Context
Defines the header of the custom message card.
- `title`: (Required) The main heading.
- `description`: Optional sub-heading.
- `icon`: Optional Lucide icon name.
- `priority`: `low`, `normal`, `high`, or `urgent`.

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

### Actions
Actions are rendered as buttons at the bottom of the card.

```json
{
  "id": "submit_action",
  "label": "Submit",
  "type": "PRIMARY",
  "handler": {
    "type": "CALLBACK",
    "callbackId": "my-plugin-id",
    "includeFormState": true,
    "payload": { "extra": "data" }
  }
}
```

When clicked, the UI first validates all visible inputs. If valid, the `formState` (all input values) is merged into the payload sent to your backend.

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
