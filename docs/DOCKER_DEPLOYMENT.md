# Docker Deployment Guide

This guide provides comprehensive, step-by-step instructions for deploying the Scryme Chat platform using Docker and Docker Compose in production and development environments.

---

## 1. Container Architecture Overview

The production Docker Compose topology consists of 5 core microservices orchestrated within dedicated bridge networks, with optional integration with external reverse proxies such as Traefik or Dokploy:

```text
                     ┌────────────────────────┐
                     │ Traefik / Edge Proxy   │
                     │ (Ports 80 / 443 TLS)   │
                     └───────────┬────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           │                                           │
           ▼                                           ▼
┌─────────────────────┐                     ┌─────────────────────┐
│   scrymechat-web    │                     │   scrymechat-api    │
│  (Next.js Standalone│                     │  (NestJS + Fastify) │
│     Port 3001)      │                     │     Port 3000)      │
└──────────┬──────────┘                     └──────────┬──────────┘
           │                                           │
           └─────────────────────┬─────────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
      ┌────────────────────┐ ┌───────┐ ┌────────────────────┐
      │scrymechat-postgres │ │Redis 7│ │  scrymechat-rustfs │
      │   (PostgreSQL 17)  │ │Cache  │ │   (S3 Storage)     │
      └────────────────────┘ └───────┘ └────────────────────┘
```

---

## 2. Hardware & Software Requirements

### Minimum Hardware
- **CPU**: 2 vCPUs
- **RAM**: 4 GB (8 GB recommended for simultaneous web & API builds)
- **Disk**: 20 GB SSD

### Software Prerequisites
- **Docker Engine**: `v24.0.0` or higher
- **Docker Compose**: `v2.20.0` or higher
- **Domain Names**: A primary domain (e.g., `chat.scryme.tech`) and API domain (e.g., `api.chat.scryme.tech`) with DNS A records pointing to your server's public IP address.

---

## 3. Environment Variable Configuration

Create a `.env` file in the root directory by copying the example template:

```bash
cp .env.example .env
```

### Essential Environment Variables

| Variable | Description | Example / Recommended |
| :--- | :--- | :--- |
| `WEB_DOMAIN` | Domain for the Web frontend | `chat.scryme.tech` |
| `API_DOMAIN` | Domain for the NestJS API | `api.chat.scryme.tech` |
| `BETTER_AUTH_SECRET` | Secret key for session encryption (min 32 chars) | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Auth service base URL | `https://api.chat.scryme.tech` |
| `NEXT_PUBLIC_API_URL` | Public API URL accessible from client browsers | `https://api.chat.scryme.tech` |
| `ALLOWED_ORIGINS` | Permitted origins for CORS policy | `https://chat.scryme.tech` |
| `DB_USER` | PostgreSQL superuser username | `postgres` |
| `DB_PASSWORD` | PostgreSQL user password | `StrongSecretPassword123` |
| `DB_NAME` | PostgreSQL database name | `scryme_prod` |
| `DATABASE_URL` | Full PostgreSQL connection URI | `postgresql://postgres:StrongSecretPassword123@db:5432/scryme_prod?schema=public` |
| `REDIS_PASSWORD` | Password for Redis container | `StrongRedisPassword123` |
| `REDIS_URL` | Connection string for Redis | `redis://:StrongRedisPassword123@redis:6379` |
| `STORAGE_PROVIDER` | Object storage provider (`rustfs`, `sanity`, `s3`) | `rustfs` |
| `RUSTFS_ACCESS_KEY` | Admin key for RustFS container | `rustfsadmin` |
| `RUSTFS_SECRET_KEY` | Secret key for RustFS container | `rustfssecret123` |
| `REALTIME_PROVIDER` | WebSocket provider (`socketio`) | `socketio` |
| `BOT_TOKEN_SECRET` | Secret key for machine-to-machine bot tokens | `openssl rand -hex 32` |
| `WEBHOOK_SECRET` | Secret key for validating incoming webhooks | `openssl rand -hex 32` |

---

## 4. Production Deployment

Scryme Chat provides two production Docker Compose configurations:

1. **`docker-compose.yml`**: Uses pre-built Docker images published to GitHub Container Registry (`ghcr.io`). Recommended for production deployments.
2. **`docker-compose.prod.yml`**: Builds images from local source code via multi-stage Dockerfiles. Recommended if modifying server source code before deployment.

### Option A: Pre-built Registry Images (`docker-compose.yml`)

1. **Create the Proxy Network** (if using Traefik / Dokploy):
   ```bash
   docker network create dokploy-network || true
   ```

2. **Launch the Production Stack**:
   ```bash
   docker compose up -d
   ```

3. **Verify Container Status**:
   ```bash
   docker compose ps
   ```

### Option B: Build from Source (`docker-compose.prod.yml`)

To build containers directly on the host server:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 5. Development Infrastructure Stack (`docker-compose.dev.yml`)

For local development where client code runs natively on Node.js while database and caching services run in Docker:

```bash
docker compose -f docker-compose.dev.yml up -d
```

This spins up:
- **PostgreSQL 17** exposed on host port `54321`.
- **Redis 7** exposed on host port `6479`.
- **RustFS S3** exposed on host port `9000`.

---

## 6. Automated Entrypoint & Database Migrations

Both `apps/api/Dockerfile` and `apps/web/Dockerfile` utilize `docker-entrypoint.sh` as their container entrypoint:

1. **Database Availability Check**: Polls PostgreSQL via Prisma DB execute until the server responds to `SELECT 1;`.
2. **Prisma Migration Deployment**: Executes `prisma migrate deploy` automatically against `DATABASE_URL`.
3. **Application Boot**: Hands over control to `node dist/main` (for API) or `node apps/web/server.js` (for Web).

---

## 7. Traefik Reverse Proxy & TLS Termination

`docker-compose.yml` includes Traefik labels out-of-the-box:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=dokploy-network"
  - "traefik.http.routers.scrymechat-api.rule=Host(`api.chat.scryme.tech`)"
  - "traefik.http.routers.scrymechat-api.entrypoints=websecure"
  - "traefik.http.routers.scrymechat-api.tls.certresolver=letsencrypt"
  - "traefik.http.services.scrymechat-api.loadbalancer.server.port=3000"
```

If using standard NGINX or Caddy instead of Traefik, expose ports `3000` (API) and `3001` (Web) directly in `docker-compose.yml` and proxy pass traffic accordingly.

---

## 8. Persistent Volumes & Data Backups

Data persistence is guaranteed through named Docker volumes:

- `db_data`: PostgreSQL database files (`/var/lib/postgresql/data`).
- `redis_data`: Redis snapshot files (`/data`).
- `rustfs_data`: Uploaded file attachments and user avatars (`/data`).

### Backup PostgreSQL Database
To create a live database dump:

```bash
docker exec -t scrymechat-postgres pg_dump -U postgres main > scryme_backup_$(date +%Y%m%m_%H%M%S).sql
```

### Restore PostgreSQL Database
To restore a backup into a fresh database container:

```bash
cat scryme_backup.sql | docker exec -i scrymechat-postgres psql -U postgres -d main
```

---

## 9. Monitoring & Operations

### Inspect Container Logs
```bash
# View all logs in real time
docker compose logs -f

# View API service logs only
docker compose logs -f api
```

### Healthcheck Monitoring
Containers expose built-in healthchecks tested via `wget`:
- API Healthcheck: `http://127.0.0.1:3000/api/health`
- Web Healthcheck: `http://127.0.0.1:3001/api/health`
- Postgres Healthcheck: `pg_isready -U postgres`

Check health status:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```
