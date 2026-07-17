# Organization M2M & Provisioning

Organization Machine-to-Machine (M2M) applications are designed for enterprise customers who need to programmatically manage multiple workspaces (tenants) within their organization.

## Overview

Unlike standard Bot Applications which are scoped to a single workspace, Organization M2M applications are created at the organization level. They provide a way to automate administrative tasks across all your workspaces, with a primary use case being **Workspace Provisioning**.

### Key Use Cases

- **Automated Onboarding**: Automatically create a new workspace when a new department or client is onboarded.
- **Tenant Management**: Programmatically manage settings and members across multiple organizational tenants.
- **Infrastructure as Code**: Manage your Scrymechat resources using automated scripts.

---

## Managing M2M Applications

M2M applications can be managed via the Organization settings in the dashboard or via the API.

### List M2M Applications

Returns a list of all M2M applications for the specified organization.

**Endpoint:** `GET /organizations/:orgSlug/m2m`

---

### Create M2M Application

Creates a new M2M application. This will return a `client_id` and a `client_secret`. **The secret is only shown once.**

**Endpoint:** `POST /organizations/:orgSlug/m2m`

**Body:**

```json
{
  "name": "Provisioning Service",
  "scopes": ["provisioning:workspaces"],
  "allowedIps": ["192.168.1.1"]
}
```

**Response:**

```json
{
  "id": "m2m_...",
  "name": "Provisioning Service",
  "clientId": "m2m_abc123...",
  "clientSecret": "sk_m2m_...",
  "scopes": ["provisioning:workspaces"],
  "allowedIps": ["192.168.1.1"],
  "createdAt": "..."
}
```

---

### Delete M2M Application

Permanently deletes an M2M application and revokes its access.

**Endpoint:** `DELETE /organizations/:orgSlug/m2m/:id`

---

## Workspace Provisioning

Once you have an M2M application with the `provisioning:workspaces` scope, you can use it to create new workspaces.

### Provisioning Flow

1. **Obtain Token**: Use your `client_id` and `client_secret` to get an OAuth access token (see [Authentication](/api-reference/authentication)).
2. **Call Provisioning API**: Use the token to create a new workspace.

**Endpoint:** `POST /v3/workspaces`

**Body:**

```json
{
  "name": "New Tenant Workspace",
  "slug": "tenant-slug",
  "ownerEmail": "admin@organization.com",
  "description": "A new workspace for a specific tenant",
  "industry": "Consulting",
  "channels": ["general", "announcements"],
  "initialMembers": [
    { "email": "manager@organization.com", "role": "admin" }
  ],
  "brandingConfig": {
    "primaryColor": "#007bff"
  }
}
```

### Constraints

- **Owner Membership**: The `ownerEmail` provided must belong to a user who is already a member of your organization.
- **Unique Slugs**: The `slug` must be globally unique across all of Scrymechat.

---

## Instance Management

Workspaces provisioned via an M2M application are automatically associated with the organization. Organization members can view and manage these workspaces in the **Organization Settings** dashboard.

### List Organization Workspaces

Returns a list of all workspaces provisioned or associated with the specified organization.

**Endpoint:** `GET /organizations/:orgSlug/workspaces`

**Response:**

```json
{
  "workspaces": [
    {
      "id": "...",
      "name": "Tenant A",
      "slug": "org-tenant-a",
      "createdAt": "...",
      "_count": {
        "members": 5,
        "channels": 10
      }
    }
  ]
}
```

---

## Multi-Tenant Example

For organizations managing multiple tenants, you can use a single M2M application to provision and configure each tenant's workspace:

```bash
# 1. Provision Tenant A
curl -X POST https://api.scrymechat.com/v3/workspaces \
  -H "Authorization: Bearer <m2m_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tenant A",
    "slug": "org-tenant-a",
    "ownerEmail": "admin@org.com"
  }'

# 2. Provision Tenant B
curl -X POST https://api.scrymechat.com/v3/workspaces \
  -H "Authorization: Bearer <m2m_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tenant B",
    "slug": "org-tenant-b",
    "ownerEmail": "admin@org.com"
  }'
```
