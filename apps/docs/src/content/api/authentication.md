# Authentication

The V2 API uses an OAuth2-inspired `client_credentials` flow for bot and integration authentication.

## Getting an Access Token

To interact with the API, you first need to exchange your `client_id` and `client_secret` for an access token.

**Endpoint:** `POST /v2/oauth/token`

### Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `grant_type` | `string` | Must be `client_credentials`. |
| `client_id` | `string` | Your application's client ID. |
| `client_secret` | `string` | Your application's client secret. |
| `scope` | `string` | (Optional) Space-separated list of scopes. |

### Example Request

```bash
curl -X POST https://api.yourapp.com/v2/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'
```

### Example Response

```json
{
  "access_token": "oat_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "*"
}
```

## Using the Access Token

Include the access token in the `Authorization` header of your requests using the `Bearer` prefix:

```http
Authorization: Bearer oat_...
```

## Token Prefixes

- `oat_`: OAuth Access Token (standard for integrations).
- `wst_`: Workspace Token (used for specific workspace-scoped tools).
