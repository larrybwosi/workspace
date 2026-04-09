# Workspaces

Workspaces are the top-level containers for all data in the platform.

## Base URL

All workspace endpoints are prefixed with the workspace slug:
`/v2/workspaces/:slug`

---

## Get Workspace Details

Returns information about the specified workspace.

**Endpoint:** `GET /v2/workspaces/:slug`

### Response

```json
{
  "workspace": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme",
    "icon": "https://...",
    "plan": "pro"
  }
}
```

---

## List Members

Returns a list of members in the workspace.

**Endpoint:** `GET /v2/workspaces/:slug/members`

### Scopes Required
- `members:read` or `*`

---

## Departments & Teams

Workspaces can be further organized into Departments and Teams.

### List Departments
`GET /v2/workspaces/:slug/departments`

### List Teams
`GET /v2/workspaces/:slug/teams`
