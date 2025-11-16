# Multi-Platform Push Notifications

This system provides unified push notifications across web, mobile (iOS/Android), and desktop platforms using Firebase Cloud Messaging, Expo Push Notifications, and support for Tauri desktop applications.

## Overview

The notification system automatically sends push notifications to all registered devices when:
- Users are mentioned in messages
- Tasks are assigned
- Projects are shared
- Notes are shared
- System alerts are triggered
- Scheduled notifications fire

## Platform Support

### Web (Firebase Cloud Messaging)

**Setup:**

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add a web app to your project
3. Generate Web Push certificates in Project Settings > Cloud Messaging
4. Add environment variables:

\`\`\`env
# Client-side (NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Server-side (secure)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key\n-----END PRIVATE KEY-----\n"
\`\`\`

5. Update `public/firebase-messaging-sw.js` with your Firebase config

**Client Integration:**

\`\`\`typescript
import { getFirebaseToken } from "@/lib/firebase-config"

// Request permission and get token
const token = await getFirebaseToken()

// Register token with backend
await fetch("/api/device-tokens", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token,
    platform: "web",
    deviceInfo: { browser: navigator.userAgent },
  }),
})
\`\`\`

### Mobile (Expo Push Notifications)

**Setup:**

1. Get your Expo Access Token from [expo.dev](https://expo.dev)
2. Add environment variable:

\`\`\`env
EXPO_ACCESS_TOKEN=your_expo_access_token
\`\`\`

**Mobile App Integration:**

\`\`\`javascript
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'

// Request permissions
const { status } = await Notifications.requestPermissionsAsync()

if (status === 'granted') {
  // Get Expo push token
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId,
  })).data

  // Register with backend
  await fetch('https://your-api.com/api/device-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      platform: Platform.OS, // 'ios' or 'android'
      deviceInfo: {
        os: Platform.OS,
        version: Platform.Version,
      },
    }),
  })
}
\`\`\`

### Desktop (Tauri v2)

**Setup:**

The desktop notification system is designed for future Tauri integration. Tauri apps will need to:

1. Implement a notification polling endpoint or WebSocket connection
2. Register device tokens with the backend
3. Handle notification display using Tauri's native notification API

**Placeholder Implementation:**

\`\`\`env
DESKTOP_NOTIFICATION_ENDPOINT=https://your-desktop-notification-server.com
\`\`\`

The system is ready for Tauri integration - implement the desktop client according to your Tauri setup.

## API Routes

### Register Device Token

\`\`\`typescript
POST /api/device-tokens

Body:
{
  "token": "device_fcm_token_or_expo_token",
  "platform": "web" | "ios" | "android" | "desktop",
  "deviceInfo": {
    "browser": "Chrome",
    "os": "macOS"
  }
}
\`\`\`

### Get User Devices

\`\`\`typescript
GET /api/device-tokens
\`\`\`

### Remove Device Token

\`\`\`typescript
DELETE /api/device-tokens?token=device_token
\`\`\`

### Test Notification

\`\`\`typescript
POST /api/push-notifications/test

Body:
{
  "title": "Test Notification",
  "body": "This is a test",
  "data": { "key": "value" },
  "linkUrl": "/dashboard"
}
\`\`\`

## Sending Notifications Programmatically

\`\`\`typescript
import { sendPushNotification } from "@/lib/push-notifications"

await sendPushNotification({
  userId: "user_id",
  title: "New Message",
  body: "You have a new message from John",
  data: {
    type: "message",
    channelId: "channel_id",
  },
  linkUrl: "/channels/channel_id",
  notificationId: "notification_id",
})
\`\`\`

## Notification Logs

All push notifications are logged in the database with status tracking:

\`\`\`typescript
// Query notification logs
const logs = await prisma.pushNotificationLog.findMany({
  where: { userId: "user_id" },
  orderBy: { sentAt: "desc" },
})
\`\`\`

## Security Considerations

### VAPID Key Security

**IMPORTANT**: The `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is **intentionally exposed** to the client.

This is **NOT a security risk**. VAPID keys work as a public/private key pair:
- **Public key** (`NEXT_PUBLIC_FIREBASE_VAPID_KEY`): Must be accessible to the browser for push notification registration
- **Private key**: Stored securely server-side, never exposed to client

This is the standard implementation for Web Push Notifications according to the Web Push Protocol specification.

### Sensitive Credentials

Ensure these remain server-side only (no `NEXT_PUBLIC_` prefix):
- `FIREBASE_PRIVATE_KEY` - Service account private key
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `EXPO_ACCESS_TOKEN` - Expo server access token

### Best Practices

1. **Token Validation**: Device tokens are validated before sending
2. **Rate Limiting**: Implement rate limiting on notification endpoints
3. **User Permissions**: Only send notifications to authorized users
4. **Token Expiry**: Invalid tokens are automatically deactivated
5. **Secure Storage**: Firebase private keys and access tokens are stored securely

## Testing

Use the test endpoint to verify your setup:

\`\`\`bash
curl -X POST https://your-app.com/api/push-notifications/test \
  -H "Authorization: Bearer your_session_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "Testing push notifications"
  }'
\`\`\`

## Troubleshooting

**Web notifications not working:**
- Check service worker registration in browser DevTools
- Verify VAPID key is correct
- Ensure HTTPS is enabled (required for web push)

**Mobile notifications not working:**
- Verify Expo Access Token is valid
- Check token format (Expo tokens start with `ExponentPushToken[...]`)
- Ensure app has notification permissions

**Desktop notifications:**
- Implement according to your Tauri setup
- Ensure notification endpoint is accessible
- Verify token registration
