# Custom Message Component System

The custom message component system allows you to create highly customizable message types with UI definitions provided via JSON. This enables dynamic message rendering without writing new React components.

## Overview

Custom messages are defined using the `messageType: "custom"` field and include a `metadata.uiDefinition` object that describes the UI structure, fields, and actions.

## Basic Structure

\`\`\`typescript
{
  id: "msg-123",
  userId: "user-1",
  content: "Fallback text content",
  timestamp: new Date(),
  messageType: "custom",
  metadata: {
    uiDefinition: {
      layout: "card" | "inline" | "modal",
      sections: Section[],
      actions: Action[],
      theme: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        textColor: "#000000"
      }
    }
  }
}
\`\`\`

## UI Definition Schema

### Layout Types
- `card`: Renders as a bordered card with padding
- `inline`: Renders inline without borders or padding
- `modal`: Renders as a modal-style component (future enhancement)

### Section Types

#### 1. Header Section
\`\`\`json
{
  "type": "header",
  "content": "Section Title",
  "className": "optional-css-classes"
}
\`\`\`

#### 2. Body Section
\`\`\`json
{
  "type": "body",
  "content": "Description or body text",
  "className": "optional-css-classes"
}
\`\`\`

#### 3. Field Section
\`\`\`json
{
  "type": "field",
  "fields": [
    {
      "type": "text" | "number" | "date" | "select" | "textarea" | "badge" | "progress" | "image",
      "label": "Field Label",
      "value": "field value",
      "options": ["option1", "option2"],
      "editable": true,
      "className": "optional-css-classes"
    }
  ]
}
\`\`\`

**Field Types:**
- `text`: Single-line text input/display
- `number`: Numeric input/display
- `date`: Date input/display
- `select`: Dropdown selection
- `textarea`: Multi-line text input/display
- `badge`: Colored badge display
- `progress`: Progress bar (value 0-100)
- `image`: Image display

#### 4. List Section
\`\`\`json
{
  "type": "list",
  "items": ["Item 1", "Item 2", "Item 3"],
  "className": "optional-css-classes"
}
\`\`\`

#### 5. Grid Section
\`\`\`json
{
  "type": "grid",
  "columns": 2,
  "items": ["Grid Item 1", "Grid Item 2"],
  "className": "optional-css-classes"
}
\`\`\`

#### 6. Footer Section
\`\`\`json
{
  "type": "footer",
  "content": "Footer text or metadata",
  "className": "optional-css-classes"
}
\`\`\`

### Actions

Actions are buttons that can be positioned inline (top) or in the footer (bottom).

\`\`\`json
{
  "id": "action-1",
  "label": "Button Text",
  "variant": "default" | "destructive" | "outline" | "secondary",
  "icon": "optional-icon-name",
  "position": "inline" | "footer"
}
\`\`\`

## Complete Examples

### Example 1: Project Status Update

\`\`\`json
{
  "messageType": "custom",
  "metadata": {
    "uiDefinition": {
      "layout": "card",
      "sections": [
        {
          "type": "header",
          "content": "Project Status Update"
        },
        {
          "type": "body",
          "content": "Weekly progress report for Q1 2024"
        },
        {
          "type": "field",
          "fields": [
            {
              "type": "badge",
              "label": "Status",
              "value": "On Track"
            },
            {
              "type": "progress",
              "label": "Completion",
              "value": 75
            },
            {
              "type": "text",
              "label": "Next Milestone",
              "value": "Beta Release - March 15"
            }
          ]
        },
        {
          "type": "footer",
          "content": "Last updated: 2 hours ago"
        }
      ],
      "actions": [
        {
          "id": "view-details",
          "label": "View Details",
          "variant": "default",
          "position": "footer"
        }
      ]
    }
  }
}
\`\`\`

### Example 2: Survey/Feedback Form

\`\`\`json
{
  "messageType": "custom",
  "metadata": {
    "uiDefinition": {
      "layout": "card",
      "sections": [
        {
          "type": "header",
          "content": "Quick Feedback"
        },
        {
          "type": "body",
          "content": "How satisfied are you with the new feature?"
        },
        {
          "type": "field",
          "fields": [
            {
              "type": "select",
              "label": "Rating",
              "value": "Very Satisfied",
              "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
              "editable": true
            },
            {
              "type": "textarea",
              "label": "Comments",
              "value": "",
              "editable": true
            }
          ]
        }
      ],
      "actions": [
        {
          "id": "submit-feedback",
          "label": "Submit",
          "variant": "default",
          "position": "footer"
        },
        {
          "id": "skip",
          "label": "Skip",
          "variant": "outline",
          "position": "footer"
        }
      ]
    }
  }
}
\`\`\`

### Example 3: Team Member Card

\`\`\`json
{
  "messageType": "custom",
  "metadata": {
    "uiDefinition": {
      "layout": "card",
      "sections": [
        {
          "type": "field",
          "fields": [
            {
              "type": "image",
              "value": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
              "className": "w-16 h-16 rounded-full mx-auto mb-3"
            }
          ]
        },
        {
          "type": "header",
          "content": "John Doe",
          "className": "text-center"
        },
        {
          "type": "body",
          "content": "Senior Product Designer",
          "className": "text-center"
        },
        {
          "type": "field",
          "fields": [
            {
              "type": "badge",
              "label": "Status",
              "value": "Available"
            },
            {
              "type": "text",
              "label": "Location",
              "value": "San Francisco, CA"
            }
          ]
        }
      ],
      "actions": [
        {
          "id": "send-message",
          "label": "Send Message",
          "variant": "default",
          "position": "inline"
        },
        {
          "id": "view-profile",
          "label": "View Profile",
          "variant": "outline",
          "position": "inline"
        }
      ]
    }
  }
}
\`\`\`

## Usage in Code

### Creating a Custom Message

\`\`\`typescript
import type { Message } from "@/lib/types"

const customMessage: Message = {
  id: "msg-custom-1",
  userId: "user-1",
  content: "Fallback content if custom rendering fails",
  timestamp: new Date(),
  reactions: [],
  mentions: [],
  messageType: "custom",
  metadata: {
    uiDefinition: {
      layout: "card",
      sections: [
        {
          type: "header",
          content: "Custom Message Title"
        },
        {
          type: "body",
          content: "This is a custom message with dynamic UI"
        }
      ],
      actions: [
        {
          id: "action-1",
          label: "Click Me",
          variant: "default",
          position: "footer"
        }
      ]
    }
  },
  actions: [
    {
      id: "action-1",
      label: "Click Me",
      handler: (messageId, actionId) => {
        console.log("Action clicked:", messageId, actionId)
        // Handle action logic here
      }
    }
  ]
}
\`\`\`

### Handling Actions

Actions are handled through the `actions` array on the message object. Each action should have a `handler` function:

\`\`\`typescript
actions: [
  {
    id: "approve",
    label: "Approve",
    variant: "default",
    handler: (messageId, actionId) => {
      // Call API to approve
      fetch(`/api/messages/${messageId}/actions/${actionId}`, {
        method: "POST"
      })
    }
  }
]
\`\`\`

## API Integration

When using the API hooks, custom messages can be created and updated:

\`\`\`typescript
import { useCreateMessage } from "@/hooks/api/use-messages"

const { mutate: createMessage } = useCreateMessage()

// Create a custom message
createMessage({
  channelId: "channel-1",
  content: "Fallback content",
  messageType: "custom",
  metadata: {
    uiDefinition: {
      // ... UI definition
    }
  }
})
\`\`\`

## Best Practices

1. **Always provide fallback content**: The `content` field should contain meaningful text in case custom rendering fails
2. **Keep UI definitions simple**: Complex UIs should be built as dedicated components
3. **Use semantic field labels**: Make labels clear and descriptive
4. **Validate user input**: When using editable fields, validate data before submission
5. **Handle errors gracefully**: Wrap action handlers in try-catch blocks
6. **Test with different themes**: Ensure custom colors work in both light and dark modes
7. **Optimize images**: Use appropriately sized images to avoid performance issues
8. **Limit nesting**: Keep section structures flat for better performance

## Theming

Custom messages support theme customization:

\`\`\`json
{
  "theme": {
    "backgroundColor": "#f3f4f6",
    "borderColor": "#d1d5db",
    "textColor": "#111827"
  }
}
\`\`\`

Colors should be provided in hex format and should consider both light and dark mode compatibility.

## Future Enhancements

- Modal layout support
- Rich text editing in textarea fields
- File upload fields
- Date range pickers
- Multi-step forms
- Conditional field visibility
- Field validation rules
- Custom field types via plugins
\`\`\`

```typescript file="" isHidden
