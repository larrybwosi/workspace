# External Integrations Guide

Complete guide for integrating external systems (ERP, CRM, CI/CD, etc.) with the collaboration platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [API Keys](#api-keys)
- [Webhooks](#webhooks)
- [System Messages](#system-messages)
- [Custom Message UI Definitions](#custom-message-ui-definitions)
- [Examples](#examples)
- [Rate Limits](#rate-limits)
- [Best Practices](#best-practices)
- [Support](#support)

## Overview

The platform supports external integrations through:
- **API Keys**: For authenticated API access
- **Webhooks**: For real-time event notifications
- **System Messages**: For posting updates to channels
- **Custom Message UI Definitions**: For sending rich, templated messages with interactive UI components

## Authentication

All integration requests require an API key for authentication.

### Creating an API Key

1. Navigate to Settings → Integrations → API Keys
2. Click "Create API Key"
3. Provide a name and select permissions
4. Save the generated key securely (shown only once)

### Using an API Key

Include the API key in the `X-API-Key` header:

\`\`\`bash
curl -X POST https://api.yourapp.com/api/integrations/messages \
  -H "X-API-Key: sk_abc123..." \
  -H "Content-Type: application/json" \
  -d '{"threadId": "...", "message": "..."}'
\`\`\`

## API Keys

### Permissions

API keys support granular permissions:

- `messages:read` - Read messages
- `messages:write` - Send messages
- `tasks:read` - View tasks
- `tasks:write` - Create/update tasks
- `projects:read` - View projects
- `projects:write` - Create/update projects
- `*` - All permissions (use with caution)

### Managing API Keys

**Create API Key**

\`\`\`bash
POST /api/integrations/api-keys
Authorization: Bearer <user-token>

{
  "name": "ERP Integration",
  "permissions": ["messages:write", "tasks:write"],
  "expiresAt": "2025-12-31T23:59:59Z"
}
\`\`\`

**List API Keys**

\`\`\`bash
GET /api/integrations/api-keys
Authorization: Bearer <user-token>
\`\`\`

**Revoke API Key**

\`\`\`bash
DELETE /api/integrations/api-keys/:id
Authorization: Bearer <user-token>
\`\`\`

## System Messages

### Sending Messages

**Endpoint**: `POST /api/integrations/messages`

**Headers**:
- `X-API-Key`: Your API key
- `Content-Type`: `application/json`

**Body**:

\`\`\`json
{
  "threadId": "channel-123",
  "title": "System Update",
  "message": "Inventory levels have been updated",
  "icon": "📦",
  "linkUrl": "https://erp.example.com/inventory",
  "linkText": "View in ERP",
  "source": "ERP System",
  "data": {
    "itemCount": 150,
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
\`\`\`

**Response**:

\`\`\`json
{
  "id": "msg_123",
  "threadId": "channel-123",
  "content": "📦 **System Update**\nInventory levels have been updated\n[View in ERP](https://erp.example.com/inventory)",
  "messageType": "system",
  "metadata": {
    "type": "custom_integration",
    "source": "ERP System",
    "data": {
      "itemCount": 150,
      "timestamp": "2025-01-01T00:00:00Z"
    }
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
\`\`\`

### Field Descriptions

- `threadId` **(required)**: Channel or thread ID where message should be posted
- `title` **(required)**: Bold title of the message (max 200 chars)
- `message` **(required)**: Message body (max 5000 chars, supports markdown)
- `icon` (optional): Emoji icon to display (e.g., "📦", "✅", "⚠️")
- `linkUrl` (optional): URL to link to external system
- `linkText` (optional): Text for the link (default: "View Details")
- `source` (optional): Name of the integration source
- `data` (optional): Additional metadata (any JSON object)

## Webhooks

### Creating Webhooks

**Endpoint**: `POST /api/integrations/webhooks`

\`\`\`json
{
  "name": "CI/CD Notifications",
  "url": "https://your-server.com/webhook",
  "events": [
    "task.created",
    "task.completed",
    "project.updated"
  ]
}
\`\`\`

**Response**:

\`\`\`json
{
  "id": "webhook_123",
  "name": "CI/CD Notifications",
  "url": "https://your-server.com/webhook",
  "secret": "whsec_abc123...",
  "events": ["task.created", "task.completed", "project.updated"],
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
\`\`\`

### Receiving Webhook Events

Your webhook endpoint will receive POST requests:

**Headers**:
- `X-Webhook-Signature`: HMAC SHA-256 signature
- `Content-Type`: `application/json`

**Payload**:

\`\`\`json
{
  "event": "task.created",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "id": "task_123",
    "title": "New Task",
    "projectId": "project_456",
    "createdBy": "user_789"
  }
}
\`\`\`

### Verifying Webhook Signatures

\`\`\`javascript
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Express.js example
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const isValid = verifyWebhook(req.body, signature, process.env.WEBHOOK_SECRET)
  
  if (!isValid) {
    return res.status(401).send('Invalid signature')
  }
  
  // Process webhook event
  console.log('Received event:', req.body.event)
  res.status(200).send('OK')
})
\`\`\`

### Available Events

- `task.created` - New task created
- `task.updated` - Task updated
- `task.completed` - Task marked as complete
- `task.assigned` - Task assigned to user
- `project.created` - New project created
- `project.updated` - Project updated
- `project.member_added` - Member added to project
- `message.sent` - New message sent
- `note.shared` - Note shared with user

## Custom Message UI Definitions

External services can now send custom-formatted messages with interactive UI components to specific users or channels. This enables rich, templated communications for approvals, alerts, updates, and more.

### Overview

The Custom Message UI system allows you to define messages with:
- **Multiple component types**: text, buttons, badges, progress, cards, lists, tables, timelines, approvals, alerts
- **Interactive actions**: approve, reject, link, callback handlers
- **Targeting options**: channels, specific users, or email addresses
- **Rich metadata**: tags, source tracking, expiration dates

### Creating Custom Message Definitions

**Endpoint**: `POST /api/integrations/custom-messages`

**Headers**:
- `X-API-Key`: Your API key
- `Content-Type`: application/json

**Basic Structure**:

\`\`\`json
{
  "definition": {
    "title": "Message Title",
    "type": "notification|approval|update|alert|info",
    "priority": "low|normal|high|urgent",
    "icon": "📝",
    "description": "Optional description",
    "components": [
      {
        "type": "card|text|button|progress|alert|...",
        "props": { ... },
        "children": [ ... ]
      }
    ],
    "actions": [
      {
        "id": "action-1",
        "label": "Action Label",
        "type": "primary|secondary|destructive",
        "handler": "approve|reject|link|callback"
      }
    ],
    "metadata": {
      "source": "ERP|CRM|CI-CD",
      "tags": ["tag1", "tag2"]
    }
  },
  "targetChannelId": "channel-id",
  "targetUserIds": ["user-1", "user-2"],
  "targetEmails": ["user@example.com"]
}
\`\`\`

### Component Types

#### Text Component
\`\`\`json
{
  "type": "text",
  "props": {
    "content": "Your text content",
    "className": "optional-css-classes"
  }
}
\`\`\`

#### Progress Component
\`\`\`json
{
  "type": "progress",
  "props": {
    "label": "Budget Utilization",
    "value": 75,
    "showValue": true
  }
}
\`\`\`

#### Approval Component (Special)
\`\`\`json
{
  "type": "approval",
  "props": {
    "title": "PO Approval Request",
    "description": "Please review and approve",
    "details": {
      "PO Number": "PO-12345",
      "Amount": "$50,000",
      "Vendor": "Acme Corp",
      "Due Date": "2025-01-15"
    }
  }
}
\`\`\`

#### Table Component
\`\`\`json
{
  "type": "table",
  "props": {
    "headers": ["Item", "Qty", "Price"],
    "rows": [
      ["Widget A", 100, "$10.00"],
      ["Widget B", 50, "$20.00"]
    ]
  }
}
\`\`\`

#### Timeline Component
\`\`\`json
{
  "type": "timeline",
  "props": {
    "events": [
      {
        "title": "Order Created",
        "timestamp": "2025-01-01 10:00",
        "description": "PO submitted"
      },
      {
        "title": "Awaiting Approval",
        "timestamp": "2025-01-01 10:30"
      }
    ]
  }
}
\`\`\`

### Real-World Examples

#### ERP: Purchase Order Approval

\`\`\`javascript
const axios = require('axios')

async function sendPOApproval(poData) {
  const response = await axios.post(
    'https://api.yourapp.com/api/integrations/custom-messages',
    {
      definition: {
        title: 'Purchase Order Requires Approval',
        type: 'approval',
        priority: 'high',
        icon: '💼',
        description: \`PO \${poData.number} from \${poData.vendor} needs your approval\`,
        components: [
          {
            type: 'card',
            props: { title: 'Order Details' },
            children: [
              {
                type: 'table',
                props: {
                  headers: ['Item', 'Quantity', 'Unit Price', 'Total'],
                  rows: poData.items.map(item => [
                    item.name,
                    item.qty,
                    item.unitPrice,
                    item.total
                  ])
                }
              },
              {
                type: 'progress',
                props: {
                  label: 'Budget Utilization',
                  value: (poData.amount / poData.budgetLimit) * 100,
                  showValue: true
                }
              }
            ]
          },
          {
            type: 'timeline',
            props: {
              events: [
                { title: 'Created', timestamp: poData.createdAt },
                { title: 'Pending Approval', timestamp: 'Now' }
              ]
            }
          }
        ],
        actions: [
          {
            id: 'approve',
            label: 'Approve PO',
            type: 'primary',
            handler: 'approve',
            callbackData: { poId: poData.id, action: 'approve' }
          },
          {
            id: 'reject',
            label: 'Reject PO',
            type: 'destructive',
            handler: 'reject',
            callbackData: { poId: poData.id, action: 'reject' }
          }
        ],
        metadata: {
          source: 'ERP',
          sourceId: poData.id,
          tags: ['purchase-order', 'approval', poData.vendor]
        },
        constraints: {
          requiresApproval: true,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        }
      },
      targetChannelId: 'channel-finance',
      targetUserIds: poData.approverIds
    },
    {
      headers: {
        'X-API-Key': process.env.API_KEY,
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data
}
\`\`\`

#### CI/CD: Deployment Status

\`\`\`bash
#!/bin/bash

API_KEY="sk_your_api_key"
CHANNEL_ID="channel-deployments"

curl -X POST https://api.yourapp.com/api/integrations/custom-messages \\
  -H "X-API-Key: $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "definition": {
      "title": "Deployment Pipeline Status",
      "type": "update",
      "priority": "high",
      "icon": "🚀",
      "components": [
        {
          "type": "timeline",
          "props": {
            "events": [
              { "title": "Build Started", "timestamp": "14:30" },
              { "title": "Tests Passed", "timestamp": "14:35" },
              { "title": "Deploying...", "timestamp": "Now" }
            ]
          }
        },
        {
          "type": "progress",
          "props": {
            "label": "Deployment Progress",
            "value": 65,
            "showValue": true
          }
        }
      ],
      "metadata": {
        "source": "GitHub Actions",
        "sourceId": "run-123456",
        "tags": ["deployment", "production"]
      }
    },
    "targetChannelId": "'$CHANNEL_ID'"
  }'
\`\`\`

#### CRM: New Lead Alert

\`\`\`python
import requests
import json

API_KEY = "sk_your_api_key"
API_URL = "https://api.yourapp.com/api/integrations/custom-messages"

def send_lead_alert(lead):
    payload = {
        "definition": {
            "title": f"New Lead: {lead['company']}",
            "type": "alert",
            "priority": "normal",
            "icon": "💼",
            "description": f"New {lead['industry']} prospect with {lead['employees']} employees",
            "components": [
                {
                    "type": "card",
                    "props": {"title": "Lead Information"},
                    "children": [
                        {
                            "type": "table",
                            "props": {
                                "headers": ["Field", "Value"],
                                "rows": [
                                    ["Company", lead["company"]],
                                    ["Contact", lead["contact"]],
                                    ["Email", lead["email"]],
                                    ["Potential Value", f"${lead['value']:,.0f}"],
                                    ["Industry", lead["industry"]]
                                ]
                            }
                        }
                    ]
                }
            ],
            "actions": [
                {
                    "id": "view_crm",
                    "label": "View in CRM",
                    "type": "primary",
                    "handler": "link",
                    "targetUrl": f"https://crm.example.com/leads/{lead['id']}"
                }
            ],
            "metadata": {
                "source": "CRM",
                "sourceId": lead["id"],
                "tags": ["lead", lead["industry"]]
            }
        },
        "targetChannelId": "channel-sales"
    }
    
    response = requests.post(
        API_URL,
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json"
        },
        json=payload
    )
    
    return response.json()
\`\`\`

### Validation Rules

- **title**: 1-200 characters
- **components**: At least 1 component required
- **targets**: Must specify at least one of: targetChannelId, targetUserIds, or targetEmails
- **actions**: Optional, can define up to 5 actions per message
- **expiresAt**: Must be a valid ISO 8601 datetime

### Styling & Theming

All custom messages use your app's design system and follow the configured theme (light/dark/auto). You can optionally provide custom CSS:

\`\`\`json
{
  "style": {
    "layout": "default|compact|detailed",
    "theme": "light|dark|auto",
    "customCSS": ".custom-class { color: red; }"
  }
}
\`\`\`

### Best Practices

1. **Keep it concise**: Users should understand the message at a glance
2. **Use priorities wisely**: Reserve "urgent" for truly time-sensitive messages
3. **Provide actions**: Always include at least one relevant action
4. **Set expiration**: Use constraints.expiresAt for time-sensitive content
5. **Track metadata**: Use sourceId and tags for tracing and analytics
6. **Test thoroughly**: Test your custom UI in both light and dark themes

## Examples

### ERP Integration

Post inventory updates to a channel:

\`\`\`python
import requests

API_KEY = "sk_your_api_key"
API_URL = "https://api.yourapp.com/api/integrations/messages"

def post_inventory_update(channel_id, item_count, low_stock_items):
    payload = {
        "threadId": channel_id,
        "title": "Inventory Update",
        "message": f"Total items: {item_count}\\nLow stock: {len(low_stock_items)} items",
        "icon": "📦",
        "linkUrl": "https://erp.example.com/inventory",
        "linkText": "View Full Report",
        "source": "ERP System",
        "data": {
            "itemCount": item_count,
            "lowStockItems": low_stock_items
        }
    }
    
    response = requests.post(
        API_URL,
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json"
        },
        json=payload
    )
    
    return response.json()

# Usage
post_inventory_update(
    "channel-abc123",
    1250,
    ["Widget A", "Gadget B"]
)
\`\`\`

### CI/CD Integration

Post deployment notifications:

\`\`\`bash
#!/bin/bash

API_KEY="sk_your_api_key"
CHANNEL_ID="channel-deployments"
API_URL="https://api.yourapp.com/api/integrations/messages"

curl -X POST "$API_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"threadId\": \"$CHANNEL_ID\",
    \"title\": \"Deployment Successful\",
    \"message\": \"Version 2.1.0 deployed to production\",
    \"icon\": \"🚀\",
    \"linkUrl\": \"https://github.com/org/repo/releases/tag/v2.1.0\",
    \"linkText\": \"View Release\",
    \"source\": \"GitHub Actions\",
    \"data\": {
      \"version\": \"2.1.0\",
      \"environment\": \"production\",
      \"commit\": \"abc123\"
    }
  }"
\`\`\`

### CRM Integration

Notify team of new leads:

\`\`\`javascript
const axios = require('axios')

async function notifyNewLead(leadData) {
  const response = await axios.post(
    'https://api.yourapp.com/api/integrations/messages',
    {
      threadId: 'channel-sales',
      title: 'New Lead',
      message: `${leadData.company} - ${leadData.contact}\\nValue: $${leadData.value.toLocaleString()}`,
      icon: '💼',
      linkUrl: `https://crm.example.com/leads/${leadData.id}`,
      linkText: 'View in CRM',
      source: 'CRM System',
      data: leadData
    },
    {
      headers: {
        'X-API-Key': process.env.API_KEY,
        'Content-Type': 'application/json'
      }
    }
  )
  
  return response.data
}
\`\`\`

## Rate Limits

- Default: 1000 requests per hour per API key
- Burst: Up to 100 requests per minute
- Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Best Practices

1. **Secure API Keys**
   - Store API keys in environment variables
   - Never commit keys to version control
   - Rotate keys regularly

2. **Error Handling**
   - Implement retry logic with exponential backoff
   - Log failed requests for debugging
   - Monitor rate limit headers

3. **Webhook Security**
   - Always verify webhook signatures
   - Use HTTPS for webhook URLs
   - Implement idempotency for webhook handlers

4. **Message Formatting**
   - Keep messages concise and actionable
   - Use icons consistently
   - Include relevant links to external systems
   - Use markdown for formatting

5. **Permissions**
   - Use least-privilege principle
   - Create separate keys for different integrations
   - Set expiration dates when possible

6. **Custom Message UI Definitions**
   - Use component types wisely to enhance user experience
   - Ensure actions are clear and actionable
   - Test custom messages in different themes

## Support

For issues or questions:
- Check API status at https://status.yourapp.com
- Review error codes in the API reference
- Contact support at support@yourapp.com
