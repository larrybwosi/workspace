# System Structure & Architectural Architecture

This document provides a detailed breakdown of the Scryme Chat platform architecture, software components, monorepo dependencies, real-time mechanics, database schema, and security flows.

---

## 1. System Topology & Architecture Overview

Scryme Chat follows a decoupled, microservices-ready monorepo topology. The core NestJS API acts as the centralized authority for authentication, REST endpoints, WebSockets, background tasks, and third-party service integration. Multiple frontend client applications (Web, Mobile, Desktop, Admin) interact with this single unified backend.

```text
                  ┌─────────────────────────────────────────┐
                  │          Client Applications            │
                  │  (Web, Android, Desktop, Admin, SDK)    │
                  └────────────────────┬────────────────────┘
                                       │
                         HTTP REST / WebSocket (Socket.io)
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │    Core Backend API (apps/api NestJS)   │
                  └─────────┬──────────┬──────────┬─────────┘
                            │          │          │
             ┌──────────────┘          │          └──────────────┐
             ▼                         ▼                         ▼
   ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
   │   PostgreSQL 17   │     │      Redis 7      │     │      RustFS       │
   │  (Prisma ORM DB)  │     │ (Pub/Sub Adapter) │     │  (S3 Storage)     │
   └───────────────────┘     └───────────────────┘     └───────────────────┘
```

---

## 2. Monorepo Architecture (Turborepo & pnpm)

The project uses [pnpm Workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/) to manage multi-package dependencies, incremental builds, and parallel execution.

### Monorepo Dependency Matrix

```text
               ┌─────────────────────────────────────────────────┐
               │                   Applications                  │
               │  web | api | android | desktop | admin | docs   │
               └───────┬─────────────────┬─────────────────┬─────┘
                       │                 │                 │
                       ▼                 ▼                 ▼
          ┌───────────────────┐ ┌─────────────────┐ ┌──────────────┐
          │ @repo/api-client  │ │   @repo/auth    │ │  @repo/ui    │
          └─────────┬─────────┘ └────────┬────────┘ └──────┬───────┘
                    │                    │                 │
                    └─────────────────┐  │  ┌──────────────┘
                                      ▼  ▼  ▼
                              ┌───────────────────┐
                              │    @repo/shared   │
                              └─────────┬─────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │  @repo/database   │
                              └───────────────────┘
```

### Turbo Pipeline (`turbo.json`)
- `build`: Compiles TypeScript outputs, builds Next.js/Vite artifacts, runs `db:generate`.
- `dev`: Runs applications concurrently with live reloading (`--parallel`).
- `type-check`: Executes `tsc --noEmit` across all workspace targets.
- `lint`: Enforces ESLint standards across TypeScript and React codebases.

---

## 3. Applications Breakdown (`apps/`)

### 1. `apps/api` (Core Backend API)
- **Framework**: NestJS v11 built on Fastify for max HTTP throughput.
- **Real-time Gateway**: `RealtimeGateway` using Socket.io v4 and Redis Adapter (`@socket.io/redis-adapter`) for horizontal scaling.
- **Key Modules**:
  - `AuthModule`: Integrates `@thallesp/nestjs-better-auth` for authentication, session verification, and OAuth2 device authorization.
  - `WorkspacesModule`: Workspace provisioning, member invitation, slug routing, channel categories.
  - `ChannelsModule`: Public & private channel creation, permission checks, message history, unread calculation.
  - `DmsModule`: Direct message conversations, unread counters, DM typing events, companion mapping.
  - `FriendsModule`: Friend requests, accept/reject, blocked list, user presence.
  - `StorageModule`: Multi-provider file upload abstraction (RustFS S3, Sanity, AWS S3).
  - `TasksModule`: Background cron jobs (`TasksService.handleCron` scheduled every 10 minutes).
  - `AgoraModule`: Generates WebRTC tokens (`agora-token`) for voice and video room channels.
  - `DeviceAuthModule`: Public QR-code based device login (`@AllowAnonymous()`).
  - `McpModule`: Model Context Protocol (MCP) server integration for AI assistant interaction.

### 2. `apps/web` (Main Web Application)
- **Framework**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4.
- **Key Features**:
  - `WorkspaceRail` & `WorkspaceSidebar`: Channel categories, collapsible groups, user controls.
  - `ChatView`: Realtime message stream, markdown rendering, code block highlight, reactions, user mentions (`@user`), channel tags (`#channel`).
  - `PWA Capability`: Powered by `@ducanh2912/next-pwa` with service worker `/sw.js` and custom `usePWAInstall` hook.
  - `Settings`: User profile customizer, avatar upload, application preferences, notifications settings (`apps/web/src/app/settings/page.tsx`).

### 3. `apps/android` (Native Android Client)
- **Tech Stack**: Kotlin, Jetpack Compose, Hilt DI, Room DB (v9), Retrofit, Socket.io client, Coil.
- **Architecture Highlights**:
  - `SessionManager`: Dual-layer `EncryptedSharedPreferences` with automatic KeyStore corruption recovery and fallback preference management.
  - `RealtimeService`: Standard background service managed reactively in `MainActivity` based on session state changes.
  - `ChatRepository`: Local-first Room storage (`MessageEntity`, `ChannelEntity`, `DmConversationEntity`) providing instant offline access and read-receipt synchronization.
  - `MarkdownText`: Custom markdown parsing with string annotations for user mentions and channel links.
  - `Push Notifications`: `ScrymeFirebaseMessagingService` with deep-linking extra parsing targeting `MainActivity`.

### 4. `apps/desktop` (Tauri Desktop App)
- **Tech Stack**: Tauri v2 + React 19 + Vite + Tailwind CSS v4.
- **Key Features**:
  - Custom frameless titlebar with window drag/minimize/maximize controls.
  - Local SQLite caching via `@tauri-apps/plugin-sql`.
  - System tray icon with background minimize option.
  - Custom protocol registration (`scryme://`) for deep-linking.
  - Dynamic API URL configuration stored in `window.localStorage` (`CUSTOM_API_URL`).

### 5. `apps/admin` (System Administration Dashboard)
- **Tech Stack**: Vite + React 19 + React Router v7 + Tailwind CSS v4.
- **Key Features**:
  - Global system metrics, tenant workspace list, workspace creation/deletion, system configuration flags.

### 6. `apps/docs` (Developer Documentation Site)
- **Tech Stack**: Vite + React 19 + React Markdown + Remark GFM.
- **Key Features**:
  - Interactive SDK usage guides, API reference specs, OpenAPI browser, and code samples.

### 7. `apps/site` (Product Marketing Site)
- **Tech Stack**: Vite + React 19 + Tailwind CSS v4 + Motion animations.
- **Key Features**:
  - Product showcase, feature comparisons, download links for APK and desktop installers, live system status link.

---

## 4. Shared Package Ecosystem (`packages/`)

| Package | Purpose & Responsibility |
| :--- | :--- |
| **`packages/database`** | Prisma schema (`schema.prisma`), PostgreSQL connection factory, seed scripts, migration runner. |
| **`packages/auth`** | Shared Better-Auth client/server configuration, session token extractors, dynamic origin validation. |
| **`packages/shared`** | Zod schemas, realtime event name constants, helper utilities, Socket.io options transformer. |
| **`packages/api-client`** | Tanstack Query (`useQuery`, `useMutation`) hooks wrapping Axios (`apiClient`) with dynamic token attachment. |
| **`packages/sdk`** | Official `@scryme/chat` TypeScript SDK with M2M OAuth2 token caching, `sdk.raw` dynamic proxy, and fluent helpers. |
| **`packages/ui`** | Reusable Tailwind CSS React component library (shadcn style), dialogs, tooltips, avatars, global stylesheet (`styles/globals.css`). |
| **`packages/types`** | Shared TypeScript interfaces, DTOs, entity definitions, and response envelopes. |
| **`packages/eslint-config`** | Shared ESLint rules (`@repo/eslint-config`). |
| **`packages/typescript-config`**| Shared tsconfig bases (`base.json`, `nextjs.json`, `react-library.json`). |

---

## 5. Authentication & Authorization Mechanics

Scryme Chat employs a flexible authentication pipeline built on **Better-Auth**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Authentication Flows                            │
├──────────────────┬──────────────────────────────┬──────────────────────┤
│ Mechanism        │ Target Clients               │ Credential / Header  │
├──────────────────┼──────────────────────────────┼──────────────────────┤
│ Session Cookie   │ Web App (Same-Origin)        │ Cookie: better-auth  │
│ Bearer Token     │ Mobile, Desktop, Web API     │ Authorization: Bearer│
│ M2M OAuth2 Flow  │ Backend Bots / TS SDK        │ Client Credentials   │
│ Device QR Auth   │ TV / Secondary Device Login  │ QR Verification Code │
└──────────────────┴──────────────────────────────┴──────────────────────┘
```

### Bearer Token Invalidation & Sync
When a token is acquired post-handshake, Socket.io options (`socket.opts.auth`) are updated dynamically and a clean reconnect is triggered (`packages/shared/src/realtime.ts` & Android `RealtimeService.kt`).

---

## 6. Real-Time Mechanics (Socket.io & Redis)

### Connection & Authentication
Clients connect to `/socket.io/` supplying `auth: { token: "..." }`. The gateway extracts the token, verifies the session/user via Better-Auth, and attaches the `userId` to the socket instance.

### Room Naming Conventions
- **`workspace:${slug}`**: Workspace-wide events (channel creation, member joined/left).
- **`channel:${channelId}`**: Channel messages, message reactions, typing indicators, read state.
- **`user:${userId}`**: Personal events (direct message received, friend request, unread count badge update, presence sync).

### Presence Synchronization
When a user connects, `enter-presence` adds the socket to `user:${userId}`. The server emits `presence:sync` containing current channel member states and broadcasts `user:presence` (`online` / `offline`) to mutual friends and workspace members.

---

## 7. Database Entity Schema (Prisma ORM)

```text
┌──────────────┐       ┌────────────────────┐       ┌──────────────┐
│     User     │──────<│  WorkspaceMember   │>──────│  Workspace   │
└──────┬───────┘       └────────────────────┘       └──────┬───────┘
       │                                                   │
       │               ┌────────────────────┐              │
       ├──────────────<│   ChannelMember    │>─────────────┤
       │               └──────────┬─────────┘              │
       │                          │                        │
       ▼                          ▼                        ▼
┌──────────────┐       ┌────────────────────┐       ┌──────────────┐
│  DmMessage   │       │      Message       │       │   Channel    │
└──────────────┘       └──────────┬─────────┘       └──────────────┘
                                  │
                                  ▼
                       ┌────────────────────┐
                       │     Attachment     │
                       └────────────────────┘
```

### Key Models & Attributes
- **`User`**: `id`, `email`, `name`, `avatar`, `status`, `customStatus`, `role`, `createdAt`.
- **`Workspace`**: `id`, `name`, `slug`, `icon`, `banner`, `ownerId`.
- **`Channel`**: `id`, `workspaceId`, `name`, `type` (`TEXT`, `VOICE`), `isPrivate`, `categoryId`.
- **`Message`**: `id`, `channelId`, `senderId`, `content`, `readByCurrentUser`, `createdAt`, `updatedAt`.
- **`Attachment`**: `id`, `messageId`, `url`, `type`, `size` (Formatted as String e.g. `"12.34 KB"` for safe client parsing).

---

## 8. Storage & File Upload Subsystem

Scryme Chat abstracts file storage using a pluggable provider pattern in `apps/api/src/common/storage/storage.service.ts`:

1. **RustFS (Default for Self-Hosted)**: High-performance, S3-compatible object storage container (`rustfs/rustfs`).
2. **AWS S3**: Production cloud storage using `@aws-sdk/client-s3`.
3. **Sanity CMS**: Cloud media storage using `@sanity/client`.

File uploads return an `UploadResponse` containing formatted file metadata and persistent download URLs.

---

## 9. Voice & Video Conferencing (Agora WebRTC)

- **Token Generation**: Endpoints in `AgoraController` issue short-lived Agora RTC tokens signed with `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`.
- **Client Integration**: Web and Desktop apps use `agora-rtc-react` to join multi-party voice/video rooms mapped directly to workspace channels (`type: VOICE`).

---

## 10. Mobile Push Notifications (FCM)

- Backend dispatches push notifications via Firebase Admin SDK when users receive direct messages or mentions (`@user`) while offline or in background.
- Android client processes FCM payloads using `ScrymeFirebaseMessagingService`, generating heads-up system notifications with deep links (`type: "mention"`, `type: "direct_message"`).
