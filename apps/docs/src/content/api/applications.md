# V3 Bot Applications & Workspace Installation

Bot Applications allow developers and M2M integrations to build bots and automated tools on Scrymechat.

---

## Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/v3/applications` | List bot applications owned by user/org |
| `POST` | `/v3/applications` | Create a new bot application + bot user |
| `GET` | `/v3/applications/:id` | Get application details & bot token |
| `PATCH` | `/v3/applications/:id` | Update application configuration |
| `POST` | `/v3/applications/:id/reset-token` | Regenerate bot token |
| `DELETE` | `/v3/applications/:id` | Delete application & bot user |
| `POST` | `/v3/applications/:id/install` | Install bot into target workspace |
| `GET` | `/v3/workspaces/:slug/bots` | List all bots installed in workspace |
| `POST` | `/v3/workspaces/:slug/bots` | Add an application bot to workspace |

---

## 1. Create Application

**Endpoint:** `POST /v3/applications` (or `POST /v2/applications`)

**Request Body:**

```json
{
  "name": "Production Support Bot",
  "description": "Monitors production alerts and manages support tickets",
  "workspaceSlug": "acme-corp",
  "channelDefinitions": [
    {
      "teamName": "Support",
      "channelName": "support-tickets",
      "teamDescription": "Managed by Production Support Bot",
      "icon": "life-buoy",
      "autoPopulateRoles": ["admin", "owner"]
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "id": "app_123456",
  "name": "Production Support Bot",
  "description": "Monitors production alerts and manages support tickets",
  "clientId": "app_client_789",
  "clientSecret": "sec_987654321",
  "workspaceId": "ws_acme123",
  "ownerId": "user_owner",
  "bot": {
    "id": "bot_998877",
    "name": "Production Support Bot",
    "botToken": "Ym90Xzk5ODg3Nw.1740825600000.signatureHash"
  },
  "createdAt": "2026-08-29T10:00:00.000Z"
}
```

---

## 2. Install Bot to Workspace

**Endpoint:** `POST /v3/applications/:id/install` (or `POST /v2/applications/:id/install`)

**Request Body:**

```json
{
  "workspaceSlug": "target-workspace-slug"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "workspaceId": "ws_target123",
  "applicationId": "app_123456",
  "botId": "bot_998877"
}
```

When installed:
- Bot user is added to `WorkspaceMember` as an administrator.
- If `channelDefinitions` are set, teams and channels are created automatically.
- Matching workspace members are auto-populated into the provisioned channels.

---

## 3. List Workspace Installed Bots

**Endpoint:** `GET /v3/workspaces/:slug/bots`

**Response (200 OK):**

```json
[
  {
    "id": "bot_998877",
    "name": "Production Support Bot",
    "avatar": null,
    "role": "admin",
    "application": {
      "id": "app_123456",
      "description": "Monitors production alerts",
      "clientId": "app_client_789"
    }
  }
]
```

---

## 4. Reset Bot Token

**Endpoint:** `POST /v3/applications/:id/reset-token`

**Response (200 OK):**

```json
{
  "id": "app_123456",
  "botToken": "Ym90Xzk5ODg3Nw.1740825700000.newSignatureHash",
  "bot": {
    "id": "bot_998877",
    "name": "Production Support Bot",
    "botToken": "Ym90Xzk5ODg3Nw.1740825700000.newSignatureHash"
  }
}
```

---

## 5. Delete Application

**Endpoint:** `DELETE /v3/applications/:id` (or `POST /v3/applications/:id/delete`)

**Response (200 OK):**

```json
{
  "success": true
}
```
