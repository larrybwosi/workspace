# Teams & Departments

Skyrme Chat supports hierarchical organization of workspace members through Departments and Teams.

## Departments

Departments represent the high-level organizational units (e.g., "Engineering", "Marketing").

### List Departments
**Endpoint:** `GET /v2/workspaces/:slug/departments`

### Create Department
**Endpoint:** `POST /v2/workspaces/:slug/departments`

**Body:**
```json
{
  "name": "Engineering",
  "slug": "eng",
  "description": "Software development team"
}
```

## Teams

Teams are specific groups within or across departments (e.g., "Frontend", "SRE").

### List Teams
**Endpoint:** `GET /v2/workspaces/:slug/teams`

### Create Team
**Endpoint:** `POST /v2/workspaces/:slug/teams`

**Body:**
```json
{
  "name": "Core Platform",
  "slug": "core",
  "departmentId": "dept_123"
}
```

## Team Membership

Teams track their members, allowing you to manage permissions and notifications at a granular level.

**Endpoint:** `GET /v2/workspaces/:slug/teams/:teamId`

The response includes the `members` array with user profiles.

---

For technical schemas, see [Teams](/api-reference/explorer#teams) and [Departments](/api-reference/explorer#departments).
