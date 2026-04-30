# Search

The Search API allows you to find members and messages within a workspace using text-based queries.

## Member Search

Find workspace members by name or email.

**Endpoint:** `GET /v2/workspaces/:slug/search/members`

**Query Parameters:**
- `q`: (Required) Search string.
- `limit`: (Optional) Max number of results (default 20).

**Example:**
```http
GET /v2/workspaces/acme/search/members?q=john
```

## Message Search

Search for messages containing specific text. Results can be filtered by channel.

**Endpoint:** `GET /v2/workspaces/:slug/search/messages`

**Query Parameters:**
- `q`: (Required) Search string.
- `channelId`: (Optional) Limit search to a specific channel.
- `limit`: (Optional) Max number of results (default 20).

**Example:**
```http
GET /v2/workspaces/acme/search/messages?q=deployment&channelId=chan_123
```

---

For technical schemas, see the [Search API Explorer](/api-reference/explorer#search).
