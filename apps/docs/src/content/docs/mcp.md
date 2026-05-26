# Model Context Protocol (MCP)

Skyrme Chat provides a Model Context Protocol (MCP) server that allows AI agents and IDEs (like Cursor or Claude Desktop) to interact with our documentation and API schema directly.

## Overview

The MCP server enables LLMs to:
- Read all user and developer documentation.
- Access the latest OpenAPI specification.
- Search through documentation using keywords.
- Discover available tools and resources within the Skyrme ecosystem.

## Getting Started

The MCP server is built into the Skyrme API and can be started using the following command:

```bash
pnpm --filter api mcp
```

This starts the server using the **Stdio** transport, which is the standard way for local tools to communicate with MCP hosts.

### Environment Variables

If you are running the MCP server against a local development environment, ensure you have your environment variables configured in `apps/api/.env`.

The MCP server specifically respects:
- `PORT`: The port the API server usually runs on (default: 3000).
- `DATABASE_URL`: Required if any tools need to query the database directly.

## Configuration

To use the MCP server with a client like Claude Desktop, add the following to your configuration file (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "skyrme-docs": {
      "command": "pnpm",
      "args": ["--filter", "api", "mcp"],
      "cwd": "/path/to/skyrme-chat"
    }
  }
}
```

> TIP: Replace `/path/to/skyrme-chat` with the absolute path to your local repository.

## Available Resources

The server exposes several URI schemes for accessing content:

### User Documentation
- **URI:** `docs://user/[filename.md]`
- **Description:** Access any file from the user guide.

### API Documentation
- **URI:** `docs://api/[filename.md]`
- **Description:** Access any file from the API reference.

### OpenAPI Schema
- **URI:** `docs://api/openapi.json`
- **Description:** The full OpenAPI v3 specification for the Skyrme Chat API.

## Tools

The MCP server provides the following tools that LLMs can invoke:

### `search_docs`
Search through all documentation for specific keywords.
- **Arguments:**
  - `query` (string): The search term.
- **Returns:** A list of matching documents and their URIs.

### `get_api_schema`
Retrieve the full OpenAPI schema.
- **Arguments:** None.
- **Returns:** The JSON schema for the Skyrme Chat API.

## Implementation Details

The MCP server is implemented using the `@modelcontextprotocol/sdk` and runs as a minimal NestJS application context. This ensures it has access to the necessary services without the overhead of the full API server.

The source code can be found in `apps/api/src/integrations/mcp`.
