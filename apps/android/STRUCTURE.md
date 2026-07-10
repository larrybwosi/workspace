# Android Application Architecture & Codebase Structure

This document outlines the codebase structure and architectural guidelines of the Scryme Android application. It serves as a guide to maintainable code, consistent patterns, and better developer experience (DX).

---

## 1. Directory Structure

The codebase is organized primarily by features and architectural layers:

```
apps/android/app/src/main/java/com/scrymechat/android/
├── common/             # Global utility extensions and general resources (e.g., Permissions, state/resource models)
├── data/               # Data Layer: databases, entities, network APIs, repositories, and persistence models
│   ├── local/          # Room DB, Shared Preferences (SessionManager), DAOs, Entities, DatabaseConverters
│   ├── remote/         # Retrofit APIs, network DTOs, socket.io services, HTTP interceptors
│   └── repository/     # Repositories mediating local and remote data sources
├── di/                 # Dependency Injection: Hilt Modules (DatabaseModule, NetworkModule, RepositoryModule)
├── notifications/      # FCM (Firebase Cloud Messaging), notification services, receivers, and helper logic
└── ui/                 # UI Layer: Jetpack Compose screen components, styles, themes, and ViewModels
    ├── auth/           # (Optional) Unified package grouping auth-specific screens
    ├── chat/           # Chat/DM details feed view, view models, message action dialogs
    ├── components/     # Global reusable, stateless UI elements (MarkdownText, UserAvatar, Polls, etc.)
    ├── discovery/      # Discovery workspace explore screens
    ├── friends/        # Friends, social interactions, and friend requests screens
    ├── home/           # Main workspace screen, workspace rails, category groupings, sidebar channels
    ├── navigation/     # NavHost controller, screen route definitions (Screen.kt, NavHost.kt)
    ├── notifications/  # Notification center screens and view models
    ├── profile/        # Root Profile UI, Viewing other members' profiles, ProfileViewModel
    │   └── settings/   # Consolidated package for all system and personal settings screens (details below)
    └── theme/          # UI tokens, Colors, Fonts, typography, global Material Themes, and EnterpriseTokens
```

---

## 2. Consolidating the `profile/settings/` Package

To prevent screen pollution and maintain consistent UX across settings, all setting sub-screens are grouped together under a dedicated package: `com.scrymechat.android.ui.profile.settings`.

### Core Screen Files:
*   **`SettingsCommon.kt`**: Houses package-internal UI components, layout tokens, and shared utilities (e.g., `SettingsTokens`, `SectionHeader`, `SettingsCard`, `standardTextFieldColors`, `SettingsTopBar`, `SettingsActionRow`) which keep spacing and card styling perfectly unified without duplication.
*   **`MyAccountScreen.kt`**: Full screen for displaying and updating user account details (Name, Email) and securely updating passwords via `ChangePasswordDialog`.
*   **`UserProfileScreen.kt`**: Customizable profile settings, permitting pending local image URI selections for banner/avatar with an optimized preview UI.
*   **`PrivacySafetyScreen.kt`**: Configures incoming Direct Message permission options.
*   **`DevicesScreen.kt`**: Displays registered device sessions (Web, Desktop, Mobile) and enables QR-code based instant pairing with secondary devices.
*   **`AppearanceSettingsScreen.kt`**: Provides configuration for System Default, Dark, or Light themes.
*   **`NotificationSettingsScreen.kt`**: Enables granular switches for controlling direct message, mention, and channel alerts with optimistic state persistence and fallback capabilities.
*   **`VoiceSettingsScreen.kt`**: Selects mic activation type (Voice Activity or Push-to-Talk) during real-time call states.
*   **`LanguageSettingsScreen.kt`**: Offers application-wide localization adjustments.
*   **`AuthorizedAppsScreen.kt`**: Lists and manages third-party application authorizations.

---

## 3. UI Tokenization: `EnterpriseTokens.kt`

Shared visual tokens utilized across enterprise screens (e.g., `FriendsScreen`) are centralized in `com.scrymechat.android.ui.theme.EnterpriseTokens` located inside `ui/theme/EnterpriseTokens.kt`. This ensures that:
*   Physical path and Kotlin packaging (`com.scrymechat.android.ui.theme`) are completely aligned.
*   Color styles (Base, Raised, Sunken, Accent), hairline separators, chip radii, and margins remain identical across screens.
*   Theme modifications are localized to a single file.

---

## 4. Key Developer Guidelines (Better DX)

1.  **Extract monolithic files early**: Avoid bloated screen files exceeding 400 lines when they contain distinct screens. Extract them to focused packages like `ui/profile/settings/` instead.
2.  **Stateless Composable Components**: Shared widgets inside `ui/components/` should remain completely stateless and reactive to arguments to promote reusability.
3.  **Encapsulated ViewModels**: Screen ViewModels should ideally map to distinct feature contexts (e.g. `ProfileViewModel` powering personal settings).
4.  **Optimistic Updates**: Settings should optimistically apply switches and configurations on the client UI, rolling back smoothly with an explanatory Snackbar notice on backend failures.
