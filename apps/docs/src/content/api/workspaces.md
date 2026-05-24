# Workspaces & Members

Workspaces are the top-level containers for all data in Scrymechat. Every resource (channels, messages, members) belongs to a workspace.

## Base URL

Most workspace-related endpoints are prefixed with the workspace slug:
`/v2/workspaces/:slug`

---

## Workspace Provisioning

Scrymechat supports two primary ways of creating workspaces: standard user-driven creation and Enterprise M2M provisioning. For multi-tenant organizations, see the [Organization M2M](/api-reference/organization-m2m) guide.

### Create Workspace (User)

Creates a new workspace where the authenticated user is the owner.

**Endpoint:** `POST /v2/workspaces`

**Body:**

```json
{
  "name": "My New Workspace",
  "slug": "my-new-workspace",
  "description": "Optional description",
  "industry": "Technology",
  "isPublic": false
}
```

---

### Provision Workspace (Enterprise M2M)

For enterprise customers, workspaces can be provisioned programmatically using an M2M application with the `provisioning:workspaces` scope. This allows for automated setup of workspaces, including initial members and channels. For more details on managing M2M applications and multi-tenant setups, refer to the [Organization M2M](/api-reference/organization-m2m) documentation.

**Endpoint:** `POST /v2/provisioning/workspaces`

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
