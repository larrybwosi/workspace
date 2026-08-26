# Scryme Chat - Core API & Realtime Gateway (`apps/api`)

The **Scryme Chat API** is the primary backend service powering the platform. Built on **NestJS v11** and **Fastify**, it delivers high-performance RESTful APIs, real-time WebSocket communication via **Socket.io**, database interaction via **Prisma ORM**, and multi-provider storage integration.

---

## ⚡ Key Features & Capabilities

- **High-Throughput HTTP Engine**: Built on Fastify HTTP provider (`@nestjs/platform-fastify`) for minimal overhead and high request concurrency.
- **Scalable Real-Time Engine**: `RealtimeGateway` using Socket.io v4 and Redis Adapter (`@socket.io/redis-adapter`), enabling seamless event broadcasting across multiple clustered API nodes.
- **Authentication & Security**: Integrated with Better-Auth (`@thallesp/nestjs-better-auth`), supporting same-origin cookies, Bearer tokens, M2M OAuth2 client credentials, and device QR authorization.
- **Presence & Direct Messaging**: Real-time user online/offline status sync (`presence:sync`), DM typing notifications (`dm-*`), and direct message delivery hooks (`dm:received`).
- **Pluggable Storage Abstraction**: File upload management supporting self-hosted RustFS S3, AWS S3, and Sanity CMS, with dynamic size formatting (e.g. `"12.34 KB"`).
- **Background Tasks**: Scheduled cron jobs managed by NestJS Schedule (`TasksService.handleCron` running every 10 minutes).
- **WebRTC Token Service**: On-demand Agora RTC token generation for voice and video channels.
- **OpenAPI / Swagger Docs**: Auto-generated interactive API documentation available at `/api/docs`.

---

## 🛠 Tech Stack

- **Framework**: [NestJS v11](https://nestjs.com/) with [Fastify](https://fastify.dev/)
- **Realtime**: [Socket.io v4](https://socket.io/) + Redis Pub/Sub Adapter
- **Database**: [Prisma ORM v7](https://www.prisma.io/) + [PostgreSQL 17](https://www.postgresql.org/)
- **Caching & PubSub**: [Redis 7](https://redis.io/) via `ioredis`
- **Auth Provider**: [Better-Auth](https://better-auth.com/)
- **Voice/Video Tokens**: `agora-token`
- **Documentation**: `@nestjs/swagger`

---

## 📁 Project Structure (`apps/api/src`)

```text
apps/api/src/
├── common/
│   ├── filters/       # Global exception filters & HTTP error formatters
│   ├── guards/        # Auth Guards, ThrottlerGuards, BetterAuth Guards
│   ├── realtime/      # RealtimeGateway & Socket.io event handlers
│   ├── storage/       # Multi-provider file storage service (RustFS, S3, Sanity)
│   └── tasks/         # Background cron tasks (TasksService)
├── modules/
│   ├── auth/          # Authentication & Device QR login controllers
│   ├── channels/      # Public/private channel endpoints & members management
│   ├── dms/           # Direct message conversations & typing indicators
│   ├── friends/       # Friends list, friend requests, user presence
│   ├── mcp/           # Model Context Protocol AI assistant integration
│   ├── users/         # User profiles, avatar updates, status settings
│   └── workspaces/    # Workspace provisioning, members, and settings
├── main.ts            # Fastify server bootstrap, CORS configuration, Swagger setup
└── mcp-main.ts        # Standalone MCP server entrypoint
```

---

## 🚀 Development Setup

### 1. Start Infrastructure Dependencies
Ensure PostgreSQL and Redis containers are running:

```bash
# From repository root
docker compose -f docker-compose.dev.yml up -d
```

### 2. Run Database Migrations
Initialize database tables and seed initial data:

```bash
pnpm --filter @repo/database db:push
pnpm --filter @repo/database db:seed
```

### 3. Launch API in Development Mode

```bash
# From repository root
pnpm --filter api dev

# Or from apps/api directory
cd apps/api
pnpm dev
```

The server starts at `http://localhost:3000`. Swagger documentation is accessible at [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

---

## 🐳 Docker Container Execution

The API service is packaged into a multi-stage Docker image (`apps/api/Dockerfile`) that handles database wait logic and migrations automatically on startup via `docker-entrypoint.sh`.

To build and run the API container locally:

```bash
docker build -t scrymechat-api -f apps/api/Dockerfile .
```

For complete deployment setups with Docker Compose and Traefik, see the [Docker Deployment Guide](../../docs/DOCKER_DEPLOYMENT.md).
