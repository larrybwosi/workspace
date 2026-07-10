# Workspaces & Members

Workspaces are the top-level containers for all data in Scrymechat. Every resource (channels, messages, members) belongs to a workspace.

## Base URL

- For general V2 endpoints, endpoints are prefixed with the workspace slug:
  `/v2/workspaces/:slug`
- For V3 (Enterprise M2M and high-performance) endpoints, the prefix is:
  `/v3/workspaces`

---

## Workspace Provisioning & Management (V3 API)

Scrymechat V3 Workspace API provides complete CRUD capability for multi-tenant and enterprise integrations. These endpoints are highly optimized and support **Redis Caching** (10-minute TTL) with instant invalidation upon creation, updates, and deletion.

### List Organization Workspaces (V3)

Returns all workspaces associated with the authenticated organization or workspace context. This endpoint checks for `provisioning:workspaces` or `*` scope.

**Endpoint:** `GET /v3/workspaces`

**Headers:**
```http
Authorization: Bearer <oat_...>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspaces": [
      {
        "id": "ws_123",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "description": "Primary workspace",
        "createdAt": "2026-07-10T00:00:00.000Z"
      }
    ]
  },
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Provision Workspace (V3)

Provisions a new workspace programmatically within your organization.
When provisioned via M2M:
1. A **System Bot** is automatically created with admin privileges for the workspace.
2. Your M2M application is installed as an **Administrator** in the new workspace.
3. The specified owner and initial members are added.

**Endpoint:** `POST /v3/workspaces`

**Body:**
```json
{
  "name": "Acme Corp Team",
  "slug": "acme-corp-team",
  "ownerEmail": "admin@acme.com",
  "description": "Workspace for Acme Corp",
  "industry": "Manufacturing",
  "channels": ["general", "announcements", "random"],
  "initialMembers": [
    { "email": "alice@acme.com", "role": "admin" },
    { "email": "bob@acme.com", "role": "member" }
  ],
  "brandingConfig": {
    "primaryColor": "#ff0000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "ws_xyz",
      "slug": "acme-corp-team",
      "name": "Acme Corp Team"
    },
    "bot": {
      "id": "bot_123",
      "clientId": "bot_abc...",
      "clientSecret": "sk_bot_..."
    }
  },
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Get Workspace Details (V3)

Retrieve configuration and metadata of a specific workspace by its slug.

**Endpoint:** `GET /v3/workspaces/:slug`

**Response:**
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "ws_xyz",
      "name": "Acme Corp Team",
      "slug": "acme-corp-team",
      "description": "Workspace for Acme Corp",
      "icon": "building",
      "industry": "Manufacturing",
      "brandingConfig": {
        "primaryColor": "#ff0000"
      },
      "createdAt": "2026-07-10T00:00:00.000Z"
    }
  },
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Update Workspace (V3)

Update the details (name, description, industry, branding configuration) of a specific workspace. Instantly invalidates the details and list caches.

**Endpoint:** `PATCH /v3/workspaces/:slug`

**Body:**
```json
{
  "name": "Acme Corp Updated",
  "description": "New updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "ws_xyz",
      "name": "Acme Corp Updated",
      "slug": "acme-corp-team",
      "description": "New updated description",
      "icon": "building",
      "industry": "Manufacturing",
      "brandingConfig": {
        "primaryColor": "#ff0000"
      },
      "updatedAt": "2026-07-10T07:15:00.000Z"
    }
  },
  "timestamp": "2026-07-10T07:15:00.000Z"
}
```

---

### Delete Workspace (V3)

Permanently deletes a workspace and all of its associated data. Instantly invalidates the details and list caches.

**Endpoint:** `DELETE /v3/workspaces/:slug`

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "timestamp": "2026-07-10T07:16:00.000Z"
}
```

---

## Workspace Members

Manage the users who have access to your Scrymechat workspace.

### List Members

Returns a list of all members in the workspace, including their profile details and status.

**Endpoint:** `GET /v2/workspaces/:slug/members`

**Response:**
```json
{
  "members": [
    {
      "id": "user_123",
      "userId": "user_123",
      "workspaceId": "ws_456",
      "role": "member",
      "user": {
        "id": "user_123",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "avatar": "https://...",
        "status": "online"
      }
    }
  ],
  "source": "database"
}
```

---

### Add Member

Adds an existing Scrymechat user to the workspace.

**Endpoint:** `POST /v2/workspaces/:slug/members`

**Body:**
```json
{
  "email": "newuser@example.com",
  "role": "member"
}
```

---

### Get Member Details

Retrieve detailed information about a specific workspace member.

**Endpoint:** `GET /v2/workspaces/:slug/members/:userId`

---

### Remove Member

Removes a user from the workspace. Note: The workspace owner cannot be removed.

**Endpoint:** `DELETE /v2/workspaces/:slug/members/:userId`

---

## Organization

Scrymechat workspaces can be further organized into **Departments** and **Teams** to reflect your company's structure.

### List Departments

`GET /v2/workspaces/:slug/departments`

### List Teams

`GET /v2/workspaces/:slug/teams`
