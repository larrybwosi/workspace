# Announcements

Announcements are high-priority broadcast messages sent to specific departments in a workspace.

## Creating an Announcement

**Endpoint:** `POST /v2/workspaces/:slug/announcements`

**Body Fields:**

| Field | Type | Description |
| :--- | :--- | :--- |
| `departmentId` | `string` | Target department ID. |
| `title` | `string` | Heading of the announcement. |
| `content` | `string` | Main body text (supports Markdown). |
| `priority` | `string` | `low`, `normal`, `high`, or `urgent`. |
| `publishAt` | `string` | (Optional) ISO date to delay publication. |
| `expiresAt` | `string` | (Optional) ISO date to hide the announcement. |

## Visibility

Announcements are visible to all members of the target department and its sub-departments.

### List Announcements
**Endpoint:** `GET /v2/workspaces/:slug/announcements`

---

For technical schemas, see the [Announcements API Explorer](/api-reference/explorer#announcements).
