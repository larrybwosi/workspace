# Getting Started with Skyrme Chat API

Welcome to the Skyrme Chat developer documentation. Our API is designed to help you build powerful integrations, bots, and automations that enhance your team's workflow.

## Overview

The Skyrme Chat API is a RESTful API that uses JSON for requests and responses. It is organized around the V2 specification, focusing on workspace-level interactions.

## Key Concepts

- **Workspaces**: Everything happens inside a workspace. You'll need the workspace `slug` for most API calls.
- **Bots & Applications**: To use the API, you first create a Bot Application in the Skyrme Chat Developer Portal. This gives you the credentials needed for authentication.
- **Scoping**: Our API uses granular scopes (e.g., `messages:send`) so you can grant your apps only the permissions they need.
- **Real-time**: While you use REST to *do* things, you can use **Webhooks** or connect to our **Ably** integration to *listen* to things happening in real-time.

## Quick Start

1. **Create an App**: Go to Workspace Settings > Developer Portal and create a new Bot Application.
   - Give your application a name and description.
   - Choose whether it's a **Workspace App** (only for your workspace) or a **Public App** (can be installed by other workspaces).
2. **Get Credentials**: Copy your `Client ID` and `Client Secret` from the app details page.
3. **Authenticate**: Exchange your credentials for an access token.
   ```bash
   curl -X POST https://api.skyrme.chat/v2/oauth/token \
     -d '{"grant_type":"client_credentials","client_id":"...","client_secret":"..."}'
   ```
4. **Make your first call**: List the channels in your workspace.
   ```bash
   curl https://api.skyrme.chat/v2/workspaces/my-workspace/channels \
     -H "Authorization: Bearer <your_token>"
   ```

## Base URL

All API requests should be made to:
`https://api.skyrme.chat`

---

Next: [Learn about Authentication](/api-reference/authentication)
