# Machine-to-Machine (M2M) V3 API Integration Guide

Machine-to-Machine (M2M) integration allows your organization's backend systems and enterprise services to interact with Skyrme Chat autonomously. This is ideal for provisioning tenants, sending system updates, managing bots, and workspace CRUD operations at scale.

---

## Enterprise-Grade Security & Connections

We employ strict, modern security practices to ensure that your integration is perfectly isolated and completely secure against leakages or attacks:

1. **OAuth2 Client Credentials Grant**: Secure authentication using a unique `client_id` and `client_secret`.
2. **Timing-Safe Credential Verification**: All client secret verifications are executed in constant-time using cryptographic hashing to prevent timing attack side-channels.
3. **Robust IP Whitelisting & Normalization**: Restricts API calls to authorized IP addresses. The system automatically normalizes and validates both native IPv4, IPv6, and IPv6-mapped IPv4 (`::ffff:x.x.x.x`) structures.
4. **Tenant Isolation**: Secure context-bound verification checks ensure that an M2M application can only view, update, or manage workspaces belonging strictly to its authorized organization.

---

## Standard V3 Response Format

To simplify client construction, SDK auto-generation, and standard API consuming patterns, all V3 API endpoints (with exception of some internal fallbacks) conform to a predictable wrapped JSON response model:

```json
{
  "success": true,
  "data": {
    ...
  },
  "timestamp": "2026-07-10T06:25:22.704Z"
}
```

If an error occurs, the standard exception filter returns a clean structure:
```json
{
  "statusCode": 403,
  "timestamp": "2026-07-10T06:25:22.704Z",
  "path": "/api/v3/workspaces/acme",
  "message": "Missing provisioning:workspaces scope"
}
```

---

## V3 Authentication Workflow

### 1. Exchange Client Credentials for a Token

Submit a `POST` request to the token endpoint to obtain a secure Bearer access token:

- **Endpoint**: `/api/v3/oauth/token`
- **Scopes**:
  - `*`: Full access.
  - `provisioning:workspaces`: Access to workspace list and full CRUD capabilities.

```bash
curl -X POST https://api.yourdomain.com/api/v3/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "scope": "provisioning:workspaces"
  }'
```

**Standard Success Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "oat_f3a7...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "scope": "provisioning:workspaces"
  },
  "timestamp": "2026-07-10T06:25:22.704Z"
}
```

---

## V3 Workspace CRUD APIs

All workspace CRUD operations are accessible with the `provisioning:workspaces` scope using M2M authentication.

### 1. List All Workspaces
Retrieves all workspaces belonging to the M2M application's organization.

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v3/workspaces`

```bash
curl -X GET https://api.yourdomain.com/api/v3/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "workspaces": [
      {
        "id": "ws_123",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "description": "Primary workspace for Acme Corp teams",
        "createdAt": "2026-07-10T06:25:22.704Z"
      }
    ]
  },
  "timestamp": "2026-07-10T06:25:22.704Z"
}
```

---

### 2. Provision/Create a Workspace
Provisions a new tenant workspace. A default System Bot is created automatically as an administrator inside the newly provisioned workspace.

- **HTTP Method**: `POST`
- **Endpoint**: `/api/v3/workspaces`

```bash
curl -X POST https://api.yourdomain.com/api/v3/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme-corp",
    "ownerEmail": "admin@acme.com",
    "channels": ["general", "engineering"],
    "initialMembers": [
      { "email": "dev@acme.com", "role": "member" }
    ]
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "ws_123",
      "slug": "acme-corp",
      "name": "Acme Corp"
    },
    "bot": {
      "id": "app_bot_123",
      "clientId": "bot_xyz...",
      "clientSecret": "sec_abc..."
    }
  },
  "timestamp": "2026-07-10T06:25:22.704Z"
}
```

---

### 3. Read Workspace Details
Retrieves detailed metadata for a specific workspace by its slug.

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v3/workspaces/:slug`

```bash
curl -X GET https://api.yourdomain.com/api/v3/workspaces/acme-corp \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "ws_123",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "description": "Primary workspace for Acme Corp teams",
      "icon": "building",
      "industry": "Technology",
      "brandingConfig": null,
      "createdAt": "2026-07-10T06:25:22.704Z"
    }
  },
  "timestamp": "2026-07-10T06:25:22.704Z"
}
```

---

### 4. Update Workspace Configuration
Updates metadata, categorization, or branding of a specific workspace.

- **HTTP Method**: `PATCH`
- **Endpoint**: `/api/v3/workspaces/:slug`

```bash
curl -X PATCH https://api.yourdomain.com/api/v3/workspaces/acme-corp \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp International",
    "description": "Updated international team workspace"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "ws_123",
      "name": "Acme Corp International",
      "slug": "acme-corp",
      "description": "Updated international team workspace",
      "icon": "building",
      "industry": "Technology",
      "brandingConfig": null,
      "updatedAt": "2026-07-10T06:30:15.112Z"
    }
  },
  "timestamp": "2026-07-10T06:30:15.112Z"
}
```

---

### 5. Delete Workspace
Permanently deletes a specific workspace and its associated channels, members, and data.

- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/v3/workspaces/:slug`

```bash
curl -X DELETE https://api.yourdomain.com/api/v3/workspaces/acme-corp \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "timestamp": "2026-07-10T06:32:00.000Z"
}
```
