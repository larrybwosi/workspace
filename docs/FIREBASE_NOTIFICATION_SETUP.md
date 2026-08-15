# Firebase Cloud Messaging (FCM) Notification Setup Guide

This guide details how to set up Firebase Cloud Messaging (FCM) in ScryMeChat so that Android push notifications work seamlessly in both foreground and background app states.

---

## 1. Firebase Console Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project or select an existing project.
2. In Project Settings, click **Add App** and select **Android**.
3. Enter the Android Package Name:
   ```text
   com.scrymechat.android
   ```
4. Register the app and download `google-services.json`.

---

## 2. Android App Configuration

1. Move the downloaded `google-services.json` into the Android app directory:
   ```text
   apps/android/app/google-services.json
   ```
2. Verify that `apps/android/build.gradle.kts` contains the Google Services plugin dependency:
   ```kotlin
   plugins {
       id("com.google.gms.google-services") version "4.4.0" apply false
   }
   ```
3. Verify that `apps/android/app/build.gradle.kts` applies the plugin and includes Firebase dependencies:
   ```kotlin
   plugins {
       id("com.google.gms.google-services")
   }

   dependencies {
       implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
       implementation("com.google.firebase:firebase-messaging")
   }
   ```

---

## 3. Backend Service Account Configuration

To enable the backend server (`apps/api` / `packages/shared`) to send FCM push notifications to devices:

1. In Firebase Console, navigate to **Project Settings > Service Accounts**.
2. Click **Generate new private key** and download the JSON credentials file.
3. Set the following environment variables in your server `.env` file (or export them in your deployment environment):
   ```env
   FIREBASE_PROJECT_ID="your-firebase-project-id"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

---

## 4. Background & Foreground Handling Architecture

- **Foreground State**: When a user is actively in the app, FCM notifications trigger `ScrymeFirebaseMessagingService.onMessageReceived()`, which builds a styled system tray notification using `NotificationHelper`.
- **Background State**: FCM messages delivered with `data` or `data` + `notification` payloads are processed by `ScrymeFirebaseMessagingService.onMessageReceived()`, ensuring high-priority channels (`CHANNEL_URGENT`, `CHANNEL_HIGH`) display heads-up notifications.
- **Deep Linking**: Notification click intents carry `type`, `entityId`, and `workspaceSlug` extras targeting `MainActivity`, taking users directly to the channel or direct message thread.

---

## 5. Testing Push Notifications

### Method A: Firebase Console Test
1. In Firebase Console, go to **Engage > Messaging**.
2. Click **Create your first campaign** > **Firebase Notification messages**.
3. Enter Title and Body, click **Send test message**, and input your device FCM token (logged in Logcat under tag `ScrymeFCMService`).

### Method B: cURL / API Test
Send a POST request to your backend push notification endpoint:
```bash
curl -X POST https://api.chat.scryme.tech/v1/notifications/test-push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{
    "title": "New Direct Message",
    "body": "Hey, did you get the latest design updates?",
    "type": "direct_message",
    "entityId": "dm-12345"
  }'
```
