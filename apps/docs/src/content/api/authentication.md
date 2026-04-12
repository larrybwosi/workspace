# Authentication

The Skyrme Chat API (V2) uses an OAuth2-inspired `client_credentials` flow for bot and integration authentication. This allows your application to authenticate as itself rather than as a specific user.

## Getting an Access Token

To interact with the API, you first need to exchange your `client_id` and `client_secret` for an access token. These credentials can be obtained from the Developer Portal in your Skyrme Chat workspace settings.

**Endpoint:** `POST /v2/oauth/token`

### Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `grant_type` | `string` | Must be `client_credentials`. |
| `client_id` | `string` | Your application's client ID. |
| `client_secret` | `string` | Your application's client secret. |
| `scope` | `string` | (Optional) Space-separated list of scopes (e.g., `messages:send channels:read`). Defaults to `*` if not specified. |

### Example Request

```bash
curl -X POST https://api.skyrme.chat/v2/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "scope": "messages:send channels:read"
  }'
```

#### Node.js (TypeScript)

```typescript
import axios from 'axios';

async function getAccessToken() {
  const response = await axios.post('https://api.skyrme.chat/v2/oauth/token', {
    grant_type: 'client_credentials',
    client_id: 'your_client_id',
    client_secret: 'your_client_secret',
    scope: 'messages:send channels:read'
  });

  return response.data.access_token;
}
```

#### Python

```python
import requests

def get_access_token():
    url = "https://api.skyrme.chat/v2/oauth/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": "your_client_id",
        "client_secret": "your_client_secret",
        "scope": "messages:send channels:read"
    }

    response = requests.post(url, json=payload)
    return response.json().get("access_token")
```

### Example Response

```json
{
  "access_token": "oat_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "messages:send channels:read"
}
```

## Using the Access Token

Include the access token in the `Authorization` header of all your API requests using the `Bearer` prefix:

```http
Authorization: Bearer oat_...
```

## Token Types

- **OAuth Access Token (`oat_`)**: Issued via the OAuth2 flow, typically used by bots and external integrations.
- **Workspace Token (`wst_`)**: Long-lived tokens generated for specific internal automations or workspace-scoped tools.

## Scopes

The Skyrme Chat API uses scopes to limit access to resources:

- `*`: Full access to all resources.
- `messages:read`: Read message history.
- `messages:send`: Send new messages and replies.
- `channels:read`: List and view channel details.
- `channels:write`: Create, update, or delete channels.
- `members:read`: List workspace members.
- `members:write`: Manage workspace membership (invite/remove).
- `webhooks:read`: List configured webhooks.
- `webhooks:write`: Manage workspace webhooks.
