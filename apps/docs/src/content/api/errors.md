# Errors

Skyrme Chat API uses standard HTTP response codes to indicate the success or failure of an API request. In general: codes in the `2xx` range indicate success, codes in the `4xx` range indicate an error that failed given the information provided (e.g., a required parameter was omitted, a charge failed, etc.), and codes in the `5xx` range indicate an error with Skyrme Chat's servers.

## Error Response Format

When an error occurs, the API returns a JSON response containing an error object with the following fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `statusCode` | `number` | The HTTP status code. |
| `message` | `string` | A human-readable message providing more details about the error. |
| `error` | `string` | A short string identifier for the error type. |

### Example Error Response

```json
{
  "statusCode": 400,
  "message": "content is required",
  "error": "Bad Request"
}
```

---

## HTTP Status Codes

| Code | Type | Description |
| :--- | :--- | :--- |
| `400` | Bad Request | The request was unacceptable, often due to missing a required parameter or invalid JSON. |
| `401` | Unauthorized | No valid API key provided. |
| `403` | Forbidden | The API key doesn't have permissions to perform the request or the resource is restricted. |
| `404` | Not Found | The requested resource doesn't exist. |
| `429` | Too Many Requests | Too many requests hit the API too quickly. We recommend an exponential backoff of your requests. |
| `500, 502, 503, 504` | Server Errors | Something went wrong on Skyrme Chat's end. |

---

## Rate Limits

To ensure the stability and performance of our services, Skyrme Chat enforces rate limits on API requests. When you exceed the rate limit, the API returns a `429 Too Many Requests` response.

### Rate Limit Headers

Every API response includes headers that provide information about your current rate limit status:

| Header | Description |
| :--- | :--- |
| `X-RateLimit-Limit` | The maximum number of requests allowed in a window. |
| `X-RateLimit-Remaining` | The number of requests remaining in the current window. |
| `X-RateLimit-Reset` | The time at which the current rate limit window resets, in UTC epoch seconds. |

### Handling Rate Limits

If your application hits a rate limit, we recommend implementing an exponential backoff strategy:

1. Wait for a short period (e.g., 1 second).
2. Retry the request.
3. If it fails again, increase the wait time exponentially (e.g., 2s, 4s, 8s...).
4. Stop after a maximum number of retries or a maximum wait time.

---

## Validation Errors

For `400 Bad Request` errors caused by validation failures, the `message` field may contain an array of specific issues:

```json
{
  "statusCode": 400,
  "message": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 1 character(s)",
      "path": ["content"]
    }
  ],
  "error": "Bad Request"
}
```
