# Scryme Chat - System Admin Dashboard (`apps/admin`)

The **Admin Dashboard** is a high-performance web interface designed for platform administrators to oversee multi-tenant workspaces, manage global system configurations, perform user moderation, and monitor system health metrics across Scryme Chat deployments.

---

## ⚡ Features

- **Multi-Tenant Workspace Management**: Provision, audit, update, or archive tenant workspaces and view active channel statistics.
- **Global User Oversight & Moderation**: Search registered users, update global role privileges (`ADMIN`, `USER`), manage account statuses, and review session histories.
- **System Metrics & Analytics**: Real-time tracking of connected WebSocket sessions, active channels, total messages dispatched, and DB health.
- **Feature Flag & System Controls**: Toggle global feature toggles (e.g., voice/video calling, file uploads, OAuth registrations).

---

## 🛠 Tech Stack

- **Framework**: [Vite](https://vitejs.dev/) + [React 19](https://react.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Data Fetching**: `@repo/api-client` (TanStack Query + Axios)
- **UI Components**: `@repo/ui` (shadcn style components + Lucide Icons)

---

## 🚀 Getting Started

### Prerequisites
Ensure the root repository dependencies are installed and the API backend (`apps/api`) is running locally or accessible via URL.

### Development Commands

Run the admin dashboard locally:

```bash
# From repository root
pnpm --filter admin dev

# Or from apps/admin directory
cd apps/admin
pnpm dev
```

The application will be available at [http://localhost:5173](http://localhost:5173) (or the port assigned by Vite).

### Build for Production

Compile the production-ready static assets:

```bash
pnpm --filter admin build
```

Preview the production bundle locally:

```bash
pnpm --filter admin preview
```

---

## ⚙️ Environment Variables

The Admin Dashboard connects to the Scryme Chat API backend using the following client-side environment variable:

```env
VITE_API_URL=http://localhost:3000
```

If not specified, the API client defaults to the host origin or configured fallback base URL.
