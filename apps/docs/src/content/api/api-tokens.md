# API Tokens

Workspace API Tokens are long-lived credentials used for server-side automations and internal tools that need persistent access to workspace resources.

## Scopes & Permissions

When creating a token, you must specify granular permissions.

**Available Scopes:**
- `read:members` / `write:members`
- `read:departments` / `write:departments`
- `read:teams` / `write:teams`
- `read:announcements` / `write:announcements`
- `read:channels` / `write:channels`
- `send:messages` / `read:messages`
- `read:threads`
- `read:webhooks` / `write:webhooks`
- `read:tokens` / `write:tokens`

## Token Management

### Create Token
**Endpoint:** `POST /v2/workspaces/:slug/api-tokens`

**Request:**
```json
{
  "name": "GitHub CI Token",
  "permissions": {
    "actions": ["read:messages", "send:messages"]
  },
  "rateLimit": 5000
}
```

### Token Rotation
If a token is compromised, you can rotate it to generate a new value while keeping the same permissions and ID.

**Endpoint:** `POST /v2/workspaces/:slug/api-tokens/:tokenId/rotate`

## Usage

API Tokens are used with the `Bearer` prefix in the `Authorization` header. They are prefixed with `wst_` to distinguish them from OAuth tokens (`oat_`).

```http
Authorization: Bearer wst_...
```

---

For technical schemas, see [API Tokens Reference](/api-reference/explorer#api-tokens).
