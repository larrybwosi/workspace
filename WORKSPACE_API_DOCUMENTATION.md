# Workspace Messaging API v1 - Complete Documentation

## Overview

The Workspace Messaging API provides a comprehensive REST API for integrating with your workspace. The API **automatically derives the workspace context from your API token**, eliminating the need to specify workspace IDs in your requests. This makes integration simpler and more secure.

**Base URL:** `https://your-domain.com/api/v1`

## Key Features

- **Automatic Workspace Detection** - Workspace ID is derived from your API token
- **Granular Permissions** - Control exactly what each token can do
- **Rate Limiting** - Built-in protection with configurable limits
- **Webhook Support** - Real-time event notifications
- **Comprehensive Audit Logs** - Track all API activity
- **Enterprise Security** - Token-based authentication with HMAC signatures

---

## Authentication

All API requests require authentication using a **Workspace API Token**. The token automatically identifies your workspace, so you never need to specify workspace IDs.

### Creating API Tokens

1. Navigate to **Workspace Settings** > **Integrations** > **API Keys**
2. Click **Create API Key**
3. Enter a descriptive name
4. Select permissions:
   - `read:members` - List workspace members
   - `write:members` - Add/update members
   - `read:channels` - List channels
   - `write:channels` - Create/update channels
   - `send:messages` - Send messages to channels
   - `read:departments` - List departments
   - `write:departments` - Create/update departments
5. Configure rate limit (default: 1,000 requests/hour)
6. Set expiration date (optional)
7. Copy the token (shown only once!)

### Using API Tokens

Include your API token in the `Authorization` header using Bearer authentication:

```
Authorization: Bearer wst_your_api_token_here
```

The API will automatically:
- Validate the token
- Identify the workspace
- Check permissions
- Track usage for rate limiting

### Token Format

Workspace API tokens use the prefix `wst_` followed by 64 hexadecimal characters:

```
wst_a1b2c3d4e5f6789012345678901234567890123456789012345678901234
```

### Security Best Practices

1. **Never commit tokens to version control**
2. **Store tokens as environment variables**
3. **Rotate tokens regularly** (recommended: every 90 days)
4. **Use separate tokens for different services**
5. **Set appropriate expiration dates**
6. **Grant minimum required permissions**
7. **Monitor token usage in audit logs**

---

## Rate Limiting

Each API token has a configurable rate limit (default: 1,000 requests per hour). Rate limit information is included in all response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1735689600
```

When rate limit is exceeded:

**Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit of 1000 requests per hour exceeded"
}
```

**Headers:**
```
Retry-After: 3600
```

---

## API Endpoints

### Messages

#### Send Message

Send a message to a channel in your workspace.

**Endpoint:** `POST /api/v1/messages`

**Required Permission:** `send:messages`

**Request Body:**

```json
{
  "channelId": "channel_123",
  "content": "Hello from the API!",
  "messageType": "integration",
  "metadata": {
    "source": "my-app",
    "priority": "high",
    "tags": ["automated", "deployment"]
  },
  "attachments": [
    {
      "name": "report.pdf",
      "type": "application/pdf",
      "url": "https://example.com/files/report.pdf",
      "size": 1024000
    }
  ]
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `channelId` | string | Yes | Channel ID to send message to |
| `content` | string | Yes | Message content (max 10,000 chars) |
| `messageType` | string | No | Message type: `text`, `integration`, `system` (default: `integration`) |
| `metadata` | object | No | Custom metadata for the message |
| `attachments` | array | No | Array of file attachments |

**Response (201 Created):**

```json
{
  "success": true,
  "message": {
    "id": "msg_abc123",
    "channelId": "channel_123",
    "content": "Hello from the API!",
    "messageType": "integration",
    "metadata": {
      "source": "my-app",
      "priority": "high"
    },
    "attachments": [...],
    "createdAt": "2025-01-01T12:00:00Z",
    "user": {
      "id": "user_123",
      "name": "API Bot",
      "email": "api@workspace.com",
      "avatar": null
    }
  }
}
```

#### Send Interactive Message

Send a message with interactive action buttons that users can respond to. When a user clicks an action button, a webhook callback is sent to your specified URL.

**Endpoint:** `POST /api/v1/messages`

**Required Permission:** `send:messages`

**Request Body:**

```json
{
  "channelId": "channel_123",
  "content": "🚀 **Deployment Request**\n\nThe staging environment is ready to deploy to production.\n\n**Changes:**\n- Feature: User authentication\n- Bugfix: Payment processing\n- Performance: Database optimization",
  "messageType": "interactive",
  "actions": [
    {
      "actionId": "approve",
      "label": "Approve Deployment",
      "style": "primary",
      "value": "approved"
    },
    {
      "actionId": "reject",
      "label": "Reject",
      "style": "danger",
      "value": "rejected"
    }
  ],
  "callbackUrl": "https://your-app.com/api/deployment/callback",
  "metadata": {
    "deploymentId": "deploy_789",
    "environment": "production",
    "requestedBy": "deploy-bot"
  }
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `channelId` | string | Yes | Channel ID to send message to |
| `content` | string | Yes | Message content (supports Markdown) |
| `messageType` | string | Yes | Must be `"interactive"` for action buttons |
| `actions` | array | Yes | Array of action buttons (max 5) |
| `actions[].actionId` | string | Yes | Unique identifier for the action |
| `actions[].label` | string | Yes | Button label text |
| `actions[].style` | string | No | Button style: `default`, `primary`, `danger` |
| `actions[].value` | string | No | Optional value to include in callback |
| `callbackUrl` | string | Yes | Your endpoint to receive action responses |
| `metadata` | object | No | Custom data included in callback |

**Response (201 Created):**

```json
{
  "success": true,
  "message": {
    "id": "msg_xyz789",
    "channelId": "channel_123",
    "content": "🚀 **Deployment Request**...",
    "messageType": "interactive",
    "metadata": {
      "deploymentId": "deploy_789",
      "callbackUrl": "https://your-app.com/api/deployment/callback"
    },
    "actions": [
      {
        "id": "action_abc123",
        "actionId": "approve",
        "label": "Approve Deployment",
        "style": "primary",
        "value": "approved",
        "disabled": false,
        "order": 0
      },
      {
        "id": "action_def456",
        "actionId": "reject",
        "label": "Reject",
        "style": "danger",
        "value": "rejected",
        "disabled": false,
        "order": 1
      }
    ],
    "createdAt": "2025-01-01T12:00:00Z",
    "user": {
      "id": "user_123",
      "name": "API Bot"
    }
  }
}
```

#### Interactive Message Callback

When a user responds to an interactive message, your `callbackUrl` receives a POST request with the action details.

**Callback Request:**

```
POST https://your-app.com/api/deployment/callback
Content-Type: application/json
X-Webhook-Event: message.action_response
```

**Callback Payload:**

```json
{
  "event": "message.action_response",
  "timestamp": "2025-01-01T12:05:00Z",
  "workspace": {
    "id": "workspace_123",
    "name": "Acme Corp"
  },
  "message": {
    "id": "msg_xyz789",
    "content": "🚀 **Deployment Request**...",
    "channelId": "channel_123"
  },
  "action": {
    "id": "approve",
    "label": "Approve Deployment"
  },
  "response": {
    "userId": "user_456",
    "userName": "Jane Smith",
    "userEmail": "jane@acme.com",
    "actionValue": "approve",
    "comment": "LGTM! Deploying now.",
    "metadata": {
      "deploymentId": "deploy_789"
    },
    "respondedAt": "2025-01-01T12:05:00Z"
  }
}
```

**Your Callback Response:**

```json
{
  "success": true,
  "message": "Deployment initiated"
}
```

### Use Cases for Interactive Messages

#### 1. Approval Workflows

```javascript
// Send approval request
await api.sendMessage({
  channelId: 'approvals',
  content: '📋 **Budget Approval Request**\n\nDepartment: Engineering\nAmount: $15,000\nPurpose: New development servers',
  messageType: 'interactive',
  actions: [
    { actionId: 'approve', label: 'Approve', style: 'primary' },
    { actionId: 'reject', label: 'Reject', style: 'danger' },
    { actionId: 'request_info', label: 'Request More Info', style: 'default' }
  ],
  callbackUrl: 'https://your-app.com/api/approvals/callback',
  metadata: { requestId: 'req_123', amount: 15000 }
});
```

#### 2. Incident Response

```javascript
// Send incident alert
await api.sendMessage({
  channelId: 'incidents',
  content: '🚨 **High Priority Incident**\n\nService: Payment Gateway\nSeverity: P1\nStatus: Investigating',
  messageType: 'interactive',
  actions: [
    { actionId: 'acknowledge', label: 'Acknowledge', style: 'primary' },
    { actionId: 'escalate', label: 'Escalate', style: 'danger' }
  ],
  callbackUrl: 'https://your-app.com/api/incidents/callback',
  metadata: { incidentId: 'inc_456', severity: 'P1' }
});
```

#### 3. Survey/Poll

```javascript
// Send quick poll
await api.sendMessage({
  channelId: 'team',
  content: '📊 **Quick Poll**\n\nShall we have the team meeting at 2pm or 3pm today?',
  messageType: 'interactive',
  actions: [
    { actionId: '2pm', label: '2:00 PM', style: 'default' },
    { actionId: '3pm', label: '3:00 PM', style: 'default' }
  ],
  callbackUrl: 'https://your-app.com/api/polls/callback',
  metadata: { pollId: 'poll_789' }
});
```

### Handling Action Callbacks

#### Node.js Example

```javascript
app.post('/api/deployment/callback', async (req, res) => {
  const { event, message, action, response, workspace } = req.body;
  
  console.log(`User ${response.userName} ${action.id}d deployment`);
  
  if (action.id === 'approve') {
    // Trigger deployment
    await triggerDeployment(response.metadata.deploymentId);
    
    // Send confirmation back to channel
    await api.sendMessage({
      channelId: message.channelId,
      content: `✅ Deployment approved by ${response.userName} and initiated!`
    });
  } else if (action.id === 'reject') {
    // Cancel deployment
    await cancelDeployment(response.metadata.deploymentId);
    
    // Send notification
    await api.sendMessage({
      channelId: message.channelId,
      content: `❌ Deployment rejected by ${response.userName}\nReason: ${response.comment || 'No reason provided'}`
    });
  }
  
  res.json({ success: true });
});
```

#### Python Example

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/deployment/callback', methods=['POST'])
def deployment_callback():
    data = request.json
    event = data['event']
    message = data['message']
    action = data['action']
    response = data['response']
    workspace = data['workspace']
    
    print(f"User {response['userName']} {action['id']}d deployment")
    
    if action['id'] == 'approve':
        # Trigger deployment
        trigger_deployment(response['metadata']['deploymentId'])
        
        # Send confirmation
        api.send_message(
            message['channelId'],
            f"✅ Deployment approved by {response['userName']} and initiated!"
        )
    elif action['id'] == 'reject':
        # Cancel deployment
        cancel_deployment(response['metadata']['deploymentId'])
        
        # Send notification
        reason = response.get('comment', 'No reason provided')
        api.send_message(
            message['channelId'],
            f"❌ Deployment rejected by {response['userName']}\nReason: {reason}"
        )
    
    return jsonify({'success': True})
```

### Interactive Message Best Practices

1. **Keep Actions Clear and Concise**
   - Use descriptive labels (max 20 characters recommended)
   - Limit to 3-5 actions per message
   - Use appropriate button styles (primary for positive actions, danger for destructive)

2. **Include Context in Message Content**
   - Explain what the user is approving/rejecting
   - Include relevant details and links
   - Use Markdown for better formatting

3. **Handle Callbacks Securely**
   - Validate callback payloads
   - Verify webhook signatures (recommended)
   - Implement idempotency to handle duplicate callbacks

4. **Provide Feedback**
   - Send a follow-up message after processing the action
   - Update the original message status if possible
   - Notify relevant users of the action taken

5. **Store Action Responses**
   - Log all action responses for audit trails
   - Track who approved/rejected what and when
   - Include in your compliance reporting

6. **Set Timeouts**
   - Consider adding expiration times for time-sensitive actions
   - Disable actions after a certain period
   - Send reminders for pending actions

### Security Considerations

1. **Verify Callback Authenticity**
   - Implement HMAC signature verification for callbacks
   - Use HTTPS for callback URLs
   - Validate the workspace ID matches your records

2. **Prevent Replay Attacks**
   - Check the `respondedAt` timestamp
   - Implement nonce/unique request IDs
   - Store processed action IDs to prevent duplicates

3. **Authorize Actions**
   - Verify the user has permission to perform the action
   - Check workspace membership
   - Validate action matches original message

4. **Secure Callback Endpoints**
   - Use authentication for your callback endpoints
   - Rate limit callback endpoints
   - Implement timeout handling

---

### Channels

#### List Channels

Get all channels in your workspace.

**Endpoint:** `GET /api/v1/channels`

**Required Permission:** `read:channels`

**Response (200 OK):**

```json
{
  "channels": [
    {
      "id": "channel_123",
      "name": "general",
      "description": "General discussion",
      "type": "public",
      "workspaceId": "workspace_123",
      "departmentId": null,
      "createdAt": "2025-01-01T00:00:00Z",
      "department": null,
      "_count": {
        "messages": 1250,
        "members": 45
      }
    },
    {
      "id": "channel_456",
      "name": "engineering",
      "description": "Engineering team channel",
      "type": "private",
      "workspaceId": "workspace_123",
      "departmentId": "dept_123",
      "createdAt": "2025-01-01T00:00:00Z",
      "department": {
        "id": "dept_123",
        "name": "Engineering"
      },
      "_count": {
        "messages": 856,
        "members": 12
      }
    }
  ]
}
```

#### Create Channel

Create a new channel in your workspace.

**Endpoint:** `POST /api/v1/channels`

**Required Permission:** `write:channels`

**Request Body:**

```json
{
  "name": "product-updates",
  "description": "Product update announcements",
  "type": "public",
  "departmentId": "dept_456"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Channel name (max 100 chars) |
| `description` | string | No | Channel description (max 500 chars) |
| `type` | string | No | Channel type: `public` or `private` (default: `public`) |
| `departmentId` | string | No | Associate channel with a department |

**Response (201 Created):**

```json
{
  "success": true,
  "channel": {
    "id": "channel_789",
    "name": "product-updates",
    "description": "Product update announcements",
    "type": "public",
    "workspaceId": "workspace_123",
    "departmentId": "dept_456",
    "createdAt": "2025-01-01T12:00:00Z",
    "department": {
      "id": "dept_456",
      "name": "Product"
    }
  }
}
```

---

### Departments

#### List Departments

Get all departments in your workspace.

**Endpoint:** `GET /api/v1/departments`

**Required Permission:** `read:departments`

**Response (200 OK):**

```json
{
  "departments": [
    {
      "id": "dept_123",
      "name": "Engineering",
      "description": "Engineering department",
      "workspaceId": "workspace_123",
      "managerId": "user_123",
      "parentId": null,
      "createdAt": "2025-01-01T00:00:00Z",
      "manager": {
        "id": "user_123",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "https://..."
      },
      "parent": null,
      "_count": {
        "members": 25,
        "channels": 5,
        "children": 2
      }
    }
  ]
}
```

#### Create Department

Create a new department in your workspace.

**Endpoint:** `POST /api/v1/departments`

**Required Permission:** `write:departments`

**Request Body:**

```json
{
  "name": "Marketing",
  "description": "Marketing and communications team",
  "managerId": "user_456",
  "parentId": "dept_123"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Department name (max 100 chars) |
| `description` | string | No | Department description (max 500 chars) |
| `managerId` | string | No | User ID of the department manager |
| `parentId` | string | No | Parent department for hierarchies |

**Response (201 Created):**

```json
{
  "success": true,
  "department": {
    "id": "dept_789",
    "name": "Marketing",
    "description": "Marketing and communications team",
    "workspaceId": "workspace_123",
    "managerId": "user_456",
    "parentId": "dept_123",
    "createdAt": "2025-01-01T12:00:00Z",
    "manager": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://..."
    }
  }
}
```

---

### Members

#### List Members

Get all members in your workspace.

**Endpoint:** `GET /api/v1/members`

**Required Permission:** `read:members`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 50, max: 100) |
| `departmentId` | string | Filter by department |

**Example:**
```
GET /api/v1/members?page=1&limit=50&departmentId=dept_123
```

**Response (200 OK):**

```json
{
  "members": [
    {
      "id": "member_123",
      "workspaceId": "workspace_123",
      "userId": "user_123",
      "role": "admin",
      "departmentId": "dept_123",
      "title": "Senior Engineer",
      "joinedAt": "2025-01-01T00:00:00Z",
      "user": {
        "id": "user_123",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "avatar": "https://...",
        "status": "online"
      },
      "department": {
        "id": "dept_123",
        "name": "Engineering"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "totalPages": 3
  }
}
```

#### Add Member

Add a new member to your workspace.

**Endpoint:** `POST /api/v1/members`

**Required Permission:** `write:members`

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "role": "member",
  "departmentId": "dept_123",
  "title": "Software Developer",
  "teamIds": ["team_123", "team_456"]
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `role` | string | No | Role: `owner`, `admin`, `member`, `guest` (default: `member`) |
| `departmentId` | string | No | Assign to department |
| `title` | string | No | Job title |
| `teamIds` | array | No | Assign to teams |

**Response (201 Created):**

```json
{
  "success": true,
  "member": {
    "id": "member_789",
    "workspaceId": "workspace_123",
    "userId": "user_789",
    "role": "member",
    "departmentId": "dept_123",
    "title": "Software Developer",
    "joinedAt": "2025-01-01T12:00:00Z",
    "user": {
      "id": "user_789",
      "name": "New User",
      "email": "newuser@example.com",
      "avatar": null
    }
  }
}
```

---

## Webhooks

Webhooks enable real-time communication between your workspace and external services. The workspace ID is automatically derived from the webhook configuration.

### Incoming Webhooks

Incoming webhooks allow external services to trigger actions in your workspace without needing a full API token.

**Endpoint:** `POST /api/v1/webhooks/incoming`

**Authentication:** HMAC SHA-256 signature validation

**Required Headers:**

```
X-Webhook-Id: webhook_abc123
X-Webhook-Signature: sha256=computed_hmac_signature
Content-Type: application/json
```

#### Webhook Actions

##### 1. Send Message

Send a message to a channel via webhook.

**Payload:**

```json
{
  "action": "send_message",
  "data": {
    "channelId": "channel_123",
    "content": "Deployment to production completed successfully! 🚀"
  }
}
```

##### 2. Create Channel

Create a new channel via webhook.

**Payload:**

```json
{
  "action": "create_channel",
  "data": {
    "name": "incident-2025-01",
    "description": "January 2025 incident response",
    "type": "private"
  }
}
```

##### 3. Create Department

Create a new department via webhook.

**Payload:**

```json
{
  "action": "create_department",
  "data": {
    "name": "Customer Success",
    "description": "Customer success team"
  }
}
```

##### 4. Add Member

Add a member to the workspace via webhook.

**Payload:**

```json
{
  "action": "add_member",
  "data": {
    "email": "contractor@example.com",
    "role": "guest"
  }
}
```

#### Webhook Response

**Success (200 OK):**

```json
{
  "success": true,
  "action": "send_message",
  "result": {
    "messageId": "msg_123"
  }
}
```

**Error (400/401/500):**

```json
{
  "error": "Invalid signature",
  "code": "INVALID_SIGNATURE"
}
```

### Setting Up Incoming Webhooks

1. Go to **Workspace Settings** > **Integrations** > **Webhooks**
2. Click **Create Incoming Webhook**
3. Configure:
   - **Name:** Descriptive name (e.g., "GitHub Deployments")
   - **Target Channel:** Default channel for messages (optional)
   - **Actions:** Select allowed actions
4. Copy the **Webhook URL** and **Secret**
5. Configure your external service

### Webhook Signature Verification

To ensure webhook authenticity, validate the HMAC signature:

#### Node.js Example

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === `sha256=${computedSignature}`;
}

// Usage
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  console.log('Webhook verified:', req.body);
  res.json({ success: true });
});
```

#### Python Example

```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload, signature, secret):
    computed = hmac.new(
        secret.encode('utf-8'),
        json.dumps(payload).encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return signature == f'sha256={computed}'

# Usage
@app.route('/webhook', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Webhook-Signature')
    secret = os.environ['WEBHOOK_SECRET']
    
    if not verify_webhook_signature(request.json, signature, secret):
        return {'error': 'Invalid signature'}, 401
    
    # Process webhook
    print('Webhook verified:', request.json)
    return {'success': True}
```

---

## Error Handling

### Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "message": "Detailed explanation (optional)",
  "details": [
    {
      "field": "fieldName",
      "message": "Field-specific error"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid API token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_API_KEY` | 401 | API token is missing or invalid |
| `INSUFFICIENT_PERMISSIONS` | 403 | Token lacks required permission |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `INVALID_REQUEST_BODY` | 400 | Request validation failed |
| `CHANNEL_NOT_FOUND` | 404 | Channel does not exist |
| `DEPARTMENT_NOT_FOUND` | 404 | Department does not exist |
| `MANAGER_NOT_FOUND` | 404 | Manager not found in workspace |
| `ALREADY_MEMBER` | 409 | User is already a member |
| `INVALID_WEBHOOK` | 404 | Webhook not found or inactive |
| `INVALID_SIGNATURE` | 401 | Webhook signature validation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Best Practices

### Security

1. **Store Tokens Securely**
   ```javascript
   // ✅ Good - Use environment variables
   const API_TOKEN = process.env.WORKSPACE_API_TOKEN;
   
   // ❌ Bad - Hardcoded in source
   const API_TOKEN = 'wst_abc123...';
   ```

2. **Rotate Tokens Regularly**
   - Create new tokens every 90 days
   - Revoke old tokens immediately
   - Use different tokens per service

3. **Limit Permissions**
   ```javascript
   // ✅ Good - Minimal permissions
   permissions: ['send:messages']
   
   // ❌ Bad - Excessive permissions
   permissions: ['*']
   ```

4. **Set Expiration Dates**
   ```javascript
   // Set token to expire in 90 days
   expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
   ```

5. **Monitor Usage**
   - Review audit logs regularly
   - Set up alerts for unusual activity
   - Track rate limit usage

### Performance

1. **Implement Retry Logic with Exponential Backoff**
   ```javascript
   async function sendMessageWithRetry(payload, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await sendMessage(payload);
       } catch (error) {
         if (error.status === 429) {
           // Rate limited - wait and retry
           await sleep(Math.pow(2, i) * 1000);
           continue;
         }
         throw error;
       }
     }
   }
   ```

2. **Respect Rate Limits**
   ```javascript
   const remaining = parseInt(response.headers['x-ratelimit-remaining']);
   const resetTime = parseInt(response.headers['x-ratelimit-reset']);
   
   if (remaining < 10) {
     console.warn('Approaching rate limit');
   }
   ```

3. **Use Bulk Operations When Possible**
   ```javascript
   // ✅ Good - Bulk add members
   await addMembers({ members: [...] });
   
   // ❌ Bad - Individual requests
   for (const member of members) {
     await addMember(member);
   }
   ```

4. **Cache Responses**
   ```javascript
   const cache = new Map();
   
   async function getChannels() {
     if (cache.has('channels')) {
       return cache.get('channels');
     }
     
     const channels = await api.get('/v1/channels');
     cache.set('channels', channels);
     setTimeout(() => cache.delete('channels'), 5 * 60 * 1000); // 5 min
     
     return channels;
   }
   ```

5. **Implement Timeouts**
   ```javascript
   const response = await fetch(url, {
     headers: { Authorization: `Bearer ${token}` },
     signal: AbortSignal.timeout(10000) // 10 second timeout
   });
   ```

### Error Handling

1. **Handle All Error Codes**
   ```javascript
   try {
     const result = await api.sendMessage(payload);
   } catch (error) {
     switch (error.code) {
       case 'INVALID_API_KEY':
         // Token expired or invalid
         await refreshToken();
         break;
       case 'RATE_LIMIT_EXCEEDED':
         // Wait and retry
         await sleep(3600000);
         break;
       case 'CHANNEL_NOT_FOUND':
         // Channel doesn't exist
         console.error('Invalid channel');
         break;
       default:
         // Unknown error
         console.error('API error:', error);
     }
   }
   ```

2. **Log Errors for Debugging**
   ```javascript
   function logApiError(error, context) {
     console.error('API Error:', {
       code: error.code,
       message: error.message,
       context,
       timestamp: new Date().toISOString()
     });
   }
   ```

3. **Validate Input Before Sending**
   ```javascript
   function validateMessage(message) {
     if (!message.channelId) {
       throw new Error('channelId is required');
     }
     if (!message.content || message.content.length > 10000) {
       throw new Error('content must be 1-10000 characters');
     }
   }
   ```

4. **Provide User-Friendly Error Messages**
   ```javascript
   catch (error) {
     if (error.code === 'INSUFFICIENT_PERMISSIONS') {
       showToast('You don\'t have permission to send messages');
     } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
       showToast('Too many requests. Please try again later');
     } else {
       showToast('Something went wrong. Please try again');
     }
   }
   ```

---

## Code Examples

### Complete Node.js Integration

```javascript
const axios = require('axios');

class WorkspaceAPI {
  constructor(apiToken) {
    this.baseURL = 'https://your-domain.com/api/v1';
    this.token = apiToken;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Add response interceptor for rate limiting
    this.client.interceptors.response.use(
      response => {
        const remaining = response.headers['x-ratelimit-remaining'];
        if (remaining && parseInt(remaining) < 10) {
          console.warn('Approaching rate limit:', remaining, 'requests remaining');
        }
        return response;
      },
      error => {
        if (error.response?.status === 429) {
          console.error('Rate limit exceeded');
        }
        throw error;
      }
    );
  }
  
  async sendMessage(channelId, content, options = {}) {
    try {
      const response = await this.client.post('/messages', {
        channelId,
        content,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async listChannels() {
    const response = await this.client.get('/channels');
    return response.data.channels;
  }
  
  async createChannel(name, description, type = 'public') {
    const response = await this.client.post('/channels', {
      name,
      description,
      type
    });
    return response.data.channel;
  }
  
  async listMembers(page = 1, limit = 50) {
    const response = await this.client.get('/members', {
      params: { page, limit }
    });
    return response.data;
  }
  
  async addMember(email, role = 'member', options = {}) {
    const response = await this.client.post('/members', {
      email,
      role,
      ...options
    });
    return response.data.member;
  }
}

// Usage
const api = new WorkspaceAPI(process.env.WORKSPACE_API_TOKEN);

async function main() {
  // Send a message
  await api.sendMessage('channel_123', 'Hello from Node.js!');
  
  // Create a channel
  const channel = await api.createChannel(
    'announcements',
    'Company announcements',
    'public'
  );
  
  // List members
  const { members, pagination } = await api.listMembers();
  console.log(`Found ${pagination.total} members`);
}

main().catch(console.error);
```

### Python Integration

```python
import os
import requests
from typing import Dict, List, Optional

class WorkspaceAPI:
    def __init__(self, api_token: str):
        self.base_url = 'https://your-domain.com/api/v1'
        self.token = api_token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        })
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        url = f'{self.base_url}{endpoint}'
        response = self.session.request(method, url, **kwargs)
        
        # Check rate limit
        remaining = response.headers.get('X-RateLimit-Remaining')
        if remaining and int(remaining) < 10:
            print(f'Warning: Only {remaining} requests remaining')
        
        response.raise_for_status()
        return response.json()
    
    def send_message(
        self,
        channel_id: str,
        content: str,
        message_type: str = 'integration',
        metadata: Optional[Dict] = None
    ) -> Dict:
        return self._request('POST', '/messages', json={
            'channelId': channel_id,
            'content': content,
            'messageType': message_type,
            'metadata': metadata or {}
        })
    
    def list_channels(self) -> List[Dict]:
        result = self._request('GET', '/channels')
        return result['channels']
    
    def create_channel(
        self,
        name: str,
        description: Optional[str] = None,
        channel_type: str = 'public',
        department_id: Optional[str] = None
    ) -> Dict:
        result = self._request('POST', '/channels', json={
            'name': name,
            'description': description,
            'type': channel_type,
            'departmentId': department_id
        })
        return result['channel']
    
    def list_members(
        self,
        page: int = 1,
        limit: int = 50,
        department_id: Optional[str] = None
    ) -> Dict:
        params = {'page': page, 'limit': limit}
        if department_id:
            params['departmentId'] = department_id
        
        return self._request('GET', '/members', params=params)
    
    def add_member(
        self,
        email: str,
        role: str = 'member',
        department_id: Optional[str] = None,
        title: Optional[str] = None
    ) -> Dict:
        result = self._request('POST', '/members', json={
            'email': email,
            'role': role,
            'departmentId': department_id,
            'title': title
        })
        return result['member']

# Usage
api = WorkspaceAPI(os.environ['WORKSPACE_API_TOKEN'])

# Send a message
api.send_message(
    'channel_123',
    'Hello from Python! 🐍',
    metadata={'source': 'python-script'}
)

# Create a channel
channel = api.create_channel(
    'team-updates',
    'Team status updates',
    'public'
)
print(f'Created channel: {channel["id"]}')

# List members
result = api.list_members(limit=100)
print(f'Total members: {result["pagination"]["total"]}')
```

### Webhook Server Example (Node.js)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function verifyWebhookSignature(payload, signature) {
  const computed = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === `sha256=${computed}`;
}

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  // Verify signature
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  const { action, data } = req.body;
  
  console.log('Webhook received:', action, data);
  
  // Handle different actions
  switch (action) {
    case 'send_message':
      console.log('Message received:', data.content);
      break;
    case 'create_channel':
      console.log('Channel created:', data.name);
      break;
    default:
      console.log('Unknown action:', action);
  }
  
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

---

## Support & Resources

### Getting Help

1. **Documentation** - Read this documentation thoroughly
2. **Error Details** - Check error response messages and codes
3. **Audit Logs** - Review activity in Workspace Settings > Audit Logs
4. **API Status** - Check system status at status.your-domain.com
5. **Support** - Contact support@your-domain.com

### Additional Resources

- **Developer Portal:** https://developers.your-domain.com
- **API Changelog:** https://developers.your-domain.com/changelog
- **Status Page:** https://status.your-domain.com
- **GitHub Examples:** https://github.com/your-org/api-examples

### Rate Limit Monitoring

Monitor your API usage in **Workspace Settings** > **Integrations** > **API Keys**. Each token displays:

- Current usage count
- Rate limit
- Last used timestamp
- Request history

---

## Changelog

### v1.0.0 (2025-01-12)

**Initial Release**

- Automatic workspace detection from API tokens
- Message sending with attachments and metadata
- Channel management (list, create)
- Department management (list, create) with hierarchies
- Member management (list, add) with pagination
- Incoming webhooks with 4 action types
- HMAC signature verification
- Rate limiting with configurable limits
- Comprehensive audit logging
- Granular permission system
- Real-time event notifications via Ably

---

**Need help? Contact us at api-support@your-domain.com**
