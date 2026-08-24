# Scryme Chat - Web Application & PWA (`apps/web`)

The **Scryme Chat Web Application** is the primary browser client and Progressive Web App (PWA) for the platform. Built with **Next.js 16 (App Router)**, **React 19**, **Turbopack**, and **Tailwind CSS v4**, it delivers a desktop-class workspace messaging experience with SSR/CSR optimization, real-time Socket.io socket synchronization, WebRTC voice/video calls, and PWA installation support.

---

## 🚀 Key Features

- **Multi-Tenant Workspace Navigation**: Workspace rail, collapsible channel categories, public/private channels, and channel creation modals.
- **Rich Messaging Experience**: Real-time Socket.io message stream, markdown rendering, code syntax highlighting, emoji reactions, user mentions (`@user`), and channel tags (`#channel`).
- **Direct Messaging & Social Tools**: Direct message threads, online/offline presence indicators, companion profile cards, typing indicators, and friends list.
- **Voice & Video Conferencing**: Multi-party WebRTC audio and video channels powered by Agora RTC (`agora-rtc-react`).
- **User Profile & Settings**: Custom profile settings page (`apps/web/src/app/settings/page.tsx`) for avatar uploads, custom status updates, notification preferences, and security settings.
- **Progressive Web App (PWA)**: Auto-generated production service worker `/sw.js` (`@ducanh2912/next-pwa`), installable on iOS, Android, macOS, and Windows with global event capturing via `usePWAInstall` hook.
- **Better-Auth Integration**: Seamless session handling supporting same-origin cookies and Bearer tokens.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Standalone Mode)
- **UI Library**: [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/)
- **Realtime**: Socket.io Client + `@repo/api-client`
- **Voice/Video**: `agora-rtc-react`
- **Authentication**: `better-auth` + `@repo/auth`
- **PWA Plugin**: `@ducanh2912/next-pwa`
- **UI Components**: `@repo/ui` (shadcn style components)

---

## 📁 Key Directory Structure (`apps/web/src`)

```text
apps/web/src/
├── app/
│   ├── (auth)/        # Login, Sign Up, Device QR authorization routes
│   ├── (chat)/        # Main workspace chat, channel view, DM threads
│   ├── settings/      # User profile & settings page (page.tsx)
│   ├── api/           # Healthcheck and Next.js server route handlers
│   └── layout.tsx     # Root layout declaring PWA manifest and viewport metadata
├── components/        # Sidebar, ChatView, MessageList, VoiceChannel, SettingsModal
├── lib/               # Better-Auth client configuration & utility functions
└── public/            # PWA manifest, service worker assets, brand icons
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
Ensure the root environment file (`.env`) is configured and the API backend (`apps/api`) is running.

### 2. Launch Next.js Web App

```bash
# From repository root
pnpm --filter web dev

# Or from apps/web directory
cd apps/web
pnpm dev
```

The web application starts at [http://localhost:3001](http://localhost:3001).

---

## 🐳 Production Deployment & Docker

The Next.js application is configured for Next.js Standalone build output (`NEXT_STANDALONE=true`), creating a self-contained Node server package in `.next/standalone`.

### Docker Execution (`apps/web/Dockerfile`)

Build and run the Web container:

```bash
docker build -t scrymechat-web -f apps/web/Dockerfile .
docker run -p 3001:3001 --env-file .env scrymechat-web
```

For complete multi-container orchestration with PostgreSQL, Redis, and API microservices, see the [Docker Deployment Guide](../../docs/DOCKER_DEPLOYMENT.md).
