# Getting Started with Scrymechat API

Welcome to the Scrymechat developer documentation. Our API is designed to help you build powerful integrations, bots, and automations that enhance your team's workflow.

## Overview

The Scrymechat API is a RESTful API that uses JSON for requests and responses. It is organized around the V3 specification, focusing on workspace-level interactions and enterprise-grade provisioning.

## Key Concepts

- **Workspaces**: Everything happens inside a workspace. You'll need the workspace `slug` for most API calls.
- **Bots & Applications**: To use the API, you first create a Bot Application in the Scrymechat Developer Portal. This gives you the credentials needed for authentication.
- **M2M Applications**: For enterprise-level automation like workspace provisioning, use Machine-to-Machine (M2M) applications.
- **Scoping**: Our API uses granular scopes (e.g., `messages:send`, `provisioning:workspaces`) so you can grant your apps only the permissions they need.
- **Real-time**: While you use REST to _do_ things, you can use **Webhooks** or connect to our **Ably** integration to _listen_ to things happening in real-time.

## Quick Start

1. **Create an App**: Go to Workspace Settings > Developer Portal and create a new Bot Application.
   - Give your application a name and description.
   - Choose whether it's a **Workspace App** (only for your workspace) or a **Public App** (can be installed by other workspaces).
2. **Get Credentials**: Copy your `Client ID` and `Client Secret` from the app details page.
3. **Authenticate**: Exchange your credentials for an access token.
   ```bash
   curl -X POST https://api.chat.scryme.tech/v3/oauth/token \
     -d '{"grant_type":"client_credentials","client_id":"...","client_secret":"..."}'
   ```
4. **Make your first call**: List the channels in your workspace.
   ```bash
   curl https://api.chat.scryme.tech/v3/workspaces/my-workspace/channels \
     -H "Authorization: Bearer <your_token>"
   ```

## Base URL

All API requests should be made to:
`https://api.chat.scryme.tech`

---

Next: [Learn about Authentication](/api-reference/authentication)
