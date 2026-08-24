# Scryme Chat - Native Android Application (`apps/android`)

The **Scryme Chat Android Application** is an enterprise-grade, native mobile client built using modern Android development practices, Jetpack Compose UI, Hilt dependency injection, and a local-first offline architecture powered by Room Database and Socket.io.

---

## 📱 Highlights & Features

- **Real-Time Communication**: Instant channel and direct message synchronization via Socket.io WebSocket connections, backed by automated reconnection and session token recovery.
- **Local-First Architecture**: Offline message history and channel list persisted in local Room Database (`MessageEntity`, `ChannelEntity`, `DmConversationEntity`), offering instant app launches and smooth scroll performance.
- **Unread Separator & Receipts**: Discord-style persistent 'NEW MESSAGES' unread separator line that tracks session unread message boundaries and syncs read receipts locally and via API.
- **Mentions & Markdown**: Rich text parser rendering markdown formatting, code blocks, user mentions (`@username`), channel links (`#channel`), and inline role badges (`BOT`, `SYSTEM`, `ADMIN`, `MOD`).
- **Resilient KeyStore Session Management**: `SessionManager` utilizes `EncryptedSharedPreferences` with automatic master key recovery and fallback to safe unencrypted preferences if KeyStore corruption occurs during OS updates.
- **Firebase Push Notifications**: High-priority FCM push notifications with deep links targeting direct message conversations and user mentions.
- **Enterprise UI Design System**: Custom enterprise visual tokens (`EnterpriseTokens.kt`), 0.dp border radius channel sidebars, custom adaptive app icons, and simplified splash screens.

---

## 🛠 Tech Stack & Architecture

- **Language**: Kotlin 2.x
- **UI Framework**: [Jetpack Compose](https://developer.android.com/jetpack/compose) with Material Design 3
- **Dependency Injection**: [Hilt / Dagger](https://developer.android.com/training/dependency-injection/hilt-android)
- **Local Database**: [Room Persistence Library](https://developer.android.com/training/data-storage/room) (Schema Version 9)
- **Networking**: [Retrofit 2](https://square.github.io/retrofit/) + [OkHttp 4](https://square.github.io/okhttp/) + [Socket.io Java Client](https://github.com/socketio/socket.io-client-java)
- **Image Loading**: [Coil Compose](https://coil-kt.github.io/coil/) (Configured with authorized OkHttpClient in `ScrymeApplication.kt`)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Architecture Pattern**: MVVM (Model-View-ViewModel) + Clean Repository pattern

---

## 📂 Project Structure (`apps/android/app/src/main/java/com/scrymechat/android`)

```text
com.scrymechat.android/
├── data/
│   ├── local/        # Room Database, DAOs, Entities
│   ├── network/      # Retrofit API Interfaces, Socket.io RealtimeService
│   ├── repository/   # Chat, Workspace, Dm, and Friends Repositories
│   └── preferences/  # SessionManager & Safe Encrypted Preferences
├── di/               # Hilt Dependency Injection Modules (NetworkModule, DatabaseModule)
├── service/          # ScrymeFirebaseMessagingService & Background Services
├── ui/
│   ├── auth/         # Login & Sign Up Screens
│   ├── chat/         # ChatView, MessageItem, ChannelSidebar, MarkdownText
│   ├── home/         # MainActivity, WorkspaceRail, WorkspaceWelcomeScreen
│   ├── profile/      # User Profile, OtherUserProfile, Settings Screens
│   └── theme/        # Color schemes, Typography, EnterpriseTokens
└── ScrymeApplication.kt # Hilt Application & Custom Coil ImageLoader
```

---

## 🚀 Building & Running

### Prerequisites
- **Android Studio**: Ladybug (2024.2.1) or higher
- **JDK**: Java 17
- **Android SDK**: API Level 34 (Android 14) minimum target

### Build Commands via Gradle

Run the build commands from `apps/android` or root directory:

```bash
# Assemble Debug APK
./gradlew assembleDebug

# Assemble Production Release APK
./gradlew assembleRelease

# Run Unit Tests (Robolectric & JUnit)
./gradlew test
```

The output APK will be generated at:
`apps/android/app/build/outputs/apk/debug/app-debug.apk`

---

## ⚙️ Configuration & API URL Switcher

In development builds (`BuildConfig.DEBUG`), the app allows developers to switch API host URLs directly on the Welcome / Login screens. In production builds (`!BuildConfig.DEBUG`), API URLs containing `localhost` are automatically overridden to default to `https://api.chat.scryme.tech`.

For Firebase push notifications setup, see [Firebase Cloud Messaging Setup Guide](../../docs/FIREBASE_NOTIFICATION_SETUP.md).
