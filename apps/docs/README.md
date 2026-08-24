# Scryme Chat - Developer & API Documentation (`apps/docs`)

The **Developer Documentation Portal** is an interactive web application designed for enterprise developers, system integrators, and bot authors. It provides detailed guides, SDK quickstarts, API reference specifications, and integration examples for the Scryme Chat platform.

---

## 📚 Key Features

- **SDK Documentation Showcase**: Guides for integrating `@scryme/chat` TypeScript SDK, covering Machine-to-Machine (M2M) OAuth2 client credentials, fluent helper namespaces, and dynamic method proxying (`sdk.raw`).
- **REST API Specs**: Interactive documentation covering workspace administration, channels, direct messaging, user search, and file attachments.
- **Webhook & Integration Guides**: Specifications for setting up outgoing webhooks, bot tokens, and real-time Socket.io socket listeners.
- **Markdown & Code Highlighting**: Powered by `react-markdown` and `remark-gfm` for clean code samples and syntax highlighting.

---

## 🛠 Tech Stack

- **Framework**: [Vite](https://vitejs.dev/) + [React 19](https://react.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Markdown Renderer**: `react-markdown` + `remark-gfm`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **SDK Reference**: `@scryme/chat` workspace package

---

## 🚀 Development Setup

### Running Development Server

Start the documentation site locally:

```bash
# From repository root
pnpm --filter v3-docs dev

# Or from apps/docs directory
cd apps/docs
pnpm dev
```

The documentation portal will be served at [http://localhost:3006](http://localhost:3006).

### Building Production Bundle

Compile the static bundle:

```bash
pnpm --filter v3-docs build
```

Preview the static distribution:

```bash
pnpm --filter v3-docs preview
```

---

## 🐳 Docker Deployment

The documentation app is containerized in `apps/docs/Dockerfile` and served using `sirv-cli`:

```bash
docker build -t scrymechat-docs -f apps/docs/Dockerfile .
docker run -p 3006:3006 scrymechat-docs
```
