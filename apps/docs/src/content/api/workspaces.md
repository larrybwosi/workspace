# Workspaces & Members

Workspaces are the top-level containers for all data in Skyrme Chat. Every resource (channels, messages, members) belongs to a workspace.

## Base URL

Most workspace-related endpoints are prefixed with the workspace slug:
`/v2/workspaces/:slug`

---

## Workspace Members

Manage the users who have access to your Skyrme Chat workspace.

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
Adds an existing Skyrme Chat user to the workspace.

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

## Organization (Coming Soon)

Skyrme Chat workspaces can be further organized into **Departments** and **Teams** to reflect your company's structure.

### List Departments
`GET /v2/workspaces/:slug/departments`

### List Teams
`GET /v2/workspaces/:slug/teams`
