# Scryme Chat Enterprise Platform

Welcome to the **Scryme Chat** monorepo—a modern, enterprise-grade, multi-tenant workspace collaboration platform engineered for high-throughput real-time messaging, direct communication, voice/video conferencing, and cross-platform native experiences.

---

## 🚀 Overview

Scryme Chat provides an end-to-end communication platform designed for seamless team collaboration across web, desktop, mobile, and automated integrations. Built on top of a high-performance monorepo architecture powered by **Turborepo** and **pnpm**, Scryme Chat unifies backend microservices, web applications, cross-platform clients, and developer SDKs.

### Key Highlights

- **Multi-Tenant Workspaces & Channels**: Real-time channels (public and private), categories, role-based access control, user mentions (`@user`), and channel tags (`#channel`).
- **Direct Messaging & Social Networking**: One-on-one direct messages, online presence sync, typing indicators, user profiles, and friends management.
- **Real-Time Engine**: Low-latency Socket.io realtime gateway backed by Redis Pub/Sub adapter for instant cross-node synchronization.
- **Voice & Video Conferencing**: Low-latency WebRTC group voice and video calls powered by Agora RTC.
- **Cross-Platform Native Clients**:
  - **Web**: Next.js 16 App Router application with PWA installation support.
  - **Desktop**: Cross-platform desktop client (macOS, Windows, Linux) built with Tauri v2 and React 19.
  - **Android**: Native Android app written in Kotlin using Jetpack Compose, Hilt, Room offline caching, and FCM push notifications.
  - **Admin**: Dedicated system administration dashboard for global tenant management and system operations.
- **Machine-to-Machine Integration**: Developer SDK (`@scryme/chat`) with OAuth2 client credentials flow for automated bots and enterprise integrations.
- **Pluggable Storage Abstractions**: Flexible storage providers supporting S3-compatible RustFS, Sanity CMS, and AWS S3.

---

## 🏗 System Architecture & Monorepo Map

The repository is structured into `apps/` for deployable services and client interfaces, and `packages/` for shared components, configuration, database schemas, and client libraries:

```text
scrymechat/
├── apps/
│   ├── admin/      # System Administration Dashboard (Vite + React 19)
│   ├── android/    # Native Android Application (Kotlin + Jetpack Compose)
│   ├── api/        # Core API & Realtime Socket.io Gateway (NestJS + Fastify)
│   ├── desktop/    # Native Desktop Application (Tauri v2 + React 19)
│   ├── docs/       # Developer & API Documentation Site (Vite + React 19)
│   ├── site/       # Product Landing & Marketing Site (Vite + React 19)
│   └── web/        # Primary Web Application & PWA (Next.js 16 App Router)
├── packages/
│   ├── api-client/ # React Query & Axios API client hooks
│   ├── auth/       # Better-Auth configuration & session management
│   ├── database/   # Prisma ORM schema, migrations, and seeders
│   ├── sdk/        # Official @scryme/chat TypeScript SDK
│   ├── shared/     # Shared validation schemas, utilities, and realtime types
│   ├── types/      # Shared TypeScript domain models & DTOs
│   ├── ui/         # Shared Tailwind CSS UI component library (shadcn style)
│   ├── eslint-config/      # Shared ESLint configurations
│   └── typescript-config/  # Shared tsconfig bases
├── docs/           # In-depth system documentation & deployment guides
├── docker-compose.yml       # Production Docker Compose stack (pre-built images)
├── docker-compose.prod.yml  # Production Docker Compose stack (build from source)
└── docker-compose.dev.yml   # Development infrastructure stack (Postgres, Redis, RustFS)
```

For complete technical details on the monorepo architecture, application communications, database models, and real-time event routing, see [**System Structure Documentation**](docs/SYSTEM_STRUCTURE.md).

---

## 🛠 Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Monorepo Tooling** | [Turborepo](https://turbo.build/), [pnpm Workspaces](https://pnpm.io/) |
| **Backend Framework** | [NestJS](https://nestjs.com/) (v11) with [Fastify](https://fastify.dev/) |
| **Realtime Engine** | [Socket.io](https://socket.io/) (v4), Redis Pub/Sub Adapter |
| **Database & ORM** | [PostgreSQL 17](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/) (v7) |
| **Authentication** | [Better-Auth](https://better-auth.com/) (Session tokens, Bearer tokens, OAuth2 M2M) |
| **Web Frontend** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Standalone), [React 19](https://react.dev/), Tailwind CSS v4 |
| **Desktop Application** | [Tauri v2](https://tauri.app/), Vite, React 19, SQLite local cache |
| **Mobile Application** | [Android Kotlin](https://developer.android.com/kotlin), Jetpack Compose, Hilt, Room DB, FCM |
| **Voice & Video** | [Agora RTC SDK](https://www.agora.io/) |
| **Storage Providers** | RustFS (Self-hosted S3-compatible), AWS S3, Sanity CMS |
| **Containerization** | Docker, Docker Compose, Traefik Reverse Proxy |

---

## 📖 Quick Start (Local Development)

### Prerequisites

- **Node.js**: `v22.x` or higher
- **pnpm**: `v10.33.0` or higher (`corepack enable && corepack prepare pnpm@10.33.0 --activate`)
- **Docker & Docker Compose**: Required for running PostgreSQL, Redis, and RustFS storage locally.
- **JDK 17 / Android Studio** *(Optional)*: Required for building `apps/android`.
- **Rust Toolchain** *(Optional)*: Required for compiling `apps/desktop` with Tauri v2.

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/larrybwosi/workspace.git scrymechat
cd scrymechat
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment configuration file:

```bash
cp .env.example .env
```

Review `.env` and configure keys such as `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, and `REDIS_URL`.

### 3. Start Infrastructure Services

Spin up PostgreSQL 17, Redis 7, and RustFS local storage using the development Docker Compose configuration:

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Run Database Migrations & Seed

Initialize the database schema and seed initial workspaces/channels:

```bash
pnpm --filter @repo/database db:generate
pnpm --filter @repo/database db:push
pnpm --filter @repo/database db:seed
```

### 5. Launch Development Applications

To start all web services in parallel via Turborepo:

```bash
pnpm dev
```

The services will be accessible at:
- **Web App**: [http://localhost:3001](http://localhost:3001)
- **API Server**: [http://localhost:3000](http://localhost:3000) (Swagger Docs at `/api/docs`)
- **Admin Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Developer Documentation**: [http://localhost:3006](http://localhost:3006)
- **Product Landing Site**: [http://localhost:8080](http://localhost:8080)

---

## 🐳 Docker Deployment

Scryme Chat provides production-ready Docker Compose setups and Dockerfiles optimized for multi-stage building and minimal image footprints.

To deploy the entire production stack using pre-built images:

```bash
docker compose up -d
```

To build from source and run production services:

```bash
docker compose -f docker-compose.prod.yml up -d
```

For complete instructions on domain setup, Traefik TLS termination, persistent storage, and environment variables, refer to [**Docker Deployment Documentation**](docs/DOCKER_DEPLOYMENT.md).

---

## 📚 Specialized Documentation

- [**System Structure Architecture Guide**](docs/SYSTEM_STRUCTURE.md): Detailed architectural breakdowns, entity schemas, real-time mechanics, and package interactions.
- [**Docker Deployment Guide**](docs/DOCKER_DEPLOYMENT.md): Step-by-step instructions for containerized deployment, Traefik reverse proxy configuration, and production operations.
- [**Firebase Push Notification Setup**](docs/FIREBASE_NOTIFICATION_SETUP.md): Configuration instructions for FCM mobile push notifications.
- **Application Readmes**:
  - [System Admin Dashboard (`apps/admin`)](apps/admin/README.md)
  - [Native Android Application (`apps/android`)](apps/android/README.md)
  - [NestJS API & Realtime Server (`apps/api`)](apps/api/README.md)
  - [Tauri Desktop Application (`apps/desktop`)](apps/desktop/README.md)
  - [Developer Documentation Web App (`apps/docs`)](apps/docs/README.md)
  - [Product Landing Site (`apps/site`)](apps/site/README.md)
  - [Next.js Enterprise Web Application (`apps/web`)](apps/web/README.md)
- **SDK Readme**:
  - [Official TypeScript SDK (`packages/sdk`)](packages/sdk/README.md)

---

## 📄 License

Copyright © 2025 Scryme Chat. All rights reserved.
