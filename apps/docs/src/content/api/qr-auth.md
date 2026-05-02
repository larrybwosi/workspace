# QR Code Authentication

Skyrme Chat supports a secure, cross-device authentication flow using QR codes. This allows users to quickly log in to the desktop or web application by scanning a code with their authenticated mobile app.

## How it works

The QR code authentication flow involves several steps to ensure a secure session transfer:

1. **Session Generation**: The client requesting login (e.g., Desktop App) generates a unique `sessionId`.
2. **QR Code Display**: The client displays a QR code containing this `sessionId`.
3. **Scanning**: The user scans the QR code with the Skyrme Chat mobile app.
4. **Verification**: The mobile app prompts the user for confirmation.
5. **Authorization**: Upon confirmation, the mobile app sends the `sessionId` and the user's active session token to the Skyrme Chat API.
6. **Session Transfer**: The API verifies the request and creates a new session for the requesting client.
7. **Completion**: The requesting client polls (or listens via Ably) for the session status and retrieves the new authentication token.

## Implementation Details

### 1. Generating a Session (Desktop/Web)

The client generates a `sessionId` and starts polling for status.

**Endpoint:** `GET /auth/device/qr/status/:sessionId`

The session has a TTL of 2 minutes.

### 2. Real-time Updates

Clients can subscribe to the `qr-session:${sessionId}` channel via Ably to receive instant notification when the session is authorized.

```typescript
const channel = ably.channels.get(`qr-session:${sessionId}`);
channel.subscribe('authorized', (message) => {
  const { sessionToken } = message.data;
  // Use sessionToken to authenticate
});
```

### 3. Authorizing a Session (Mobile)

When the mobile app scans the code, it should verify the user's intent and then call the authorization endpoint.

**Endpoint:** `POST /api/auth/device/qr/authorize`

**Body:**
```json
{
  "sessionId": "..."
}
```

## Security Considerations

- **Explicit Consent**: The mobile app **must** show a confirmation modal to the user before authorizing the session.
- **Short TTL**: QR sessions expire quickly (2 minutes) to prevent reuse.
- **Device Information**: The authorization request includes device metadata to help users identify the requesting client.
