# Scryme Chat - Product Landing & Marketing Site (`apps/site`)

The **Product Marketing Site** is the public-facing landing page for Scryme Chat. It showcases platform features, security standards, cross-platform app download links (Android APK, Desktop installers), web app entrypoints, and live platform status links.

---

## ✨ Features & Sections

- **Hero & Feature Showcase**: Interactive overviews of real-time messaging, channels, direct messages, and voice/video conferencing.
- **Download Center**: Direct download links for native Android APK packages and cross-platform desktop installers (macOS `.dmg`, Windows `.exe`, Linux `.AppImage`).
- **PWA Quick Start Guide**: Step-by-step instructions for installing Scryme Chat as a Progressive Web App on mobile and desktop browsers.
- **Enterprise Security & Compliance**: Information on encryption, self-hosted deployments, and multi-tenant workspace isolation.

---

## 🛠 Tech Stack

- **Framework**: [Vite](https://vitejs.dev/) + [React 19](https://react.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + `tw-animate-css`
- **Icons**: [Lucide React](https://lucide.dev/)
- **SEO & Metadata**: `react-helmet-async`

---

## 🚀 Development Setup

### Running Development Server

Start the marketing site locally:

```bash
# From repository root
pnpm --filter site dev

# Or from apps/site directory
cd apps/site
pnpm dev
```

The application will be accessible at [http://localhost:8080](http://localhost:8080).

### Building Production Output

Compile the static bundle:

```bash
pnpm --filter site build
```

Preview static build locally:

```bash
pnpm --filter site preview
```
