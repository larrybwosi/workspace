# Widget Integration Guide

This guide explains how to integrate the messaging platform into your own applications using the Chat Widget.

## Overview

The Chat Widget is an optimized, embeddable version of the messaging interface that can be loaded via an `<iframe>`. It supports:
- **Context-aware threading**: Link a specific chat thread to a document or record in your app.
- **Single Sign-On (SSO)**: Authenticate users automatically using OAuth2 tokens.
- **Custom Theming**: Match your parent application's look and feel.

## Embedding the Widget

To embed the widget, add an `<iframe>` to your page pointing to the `/widget` route.

### URL Structure

`https://your-messaging-platform.com/widget?workspace=[slug]&token=[oauth_token]&channel=[channel_slug]&contextId=[unique_id]&theme=[dark|light]&primaryColor=[hex]`

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `workspace` | Yes | The slug of the workspace. |
| `token` | Yes | A valid OAuth2 access token for the user. |
| `channel` | No | Specific channel slug or ID to open. Defaults to general. |
| `contextId`| No | A unique ID for your document (e.g., `invoice-123`). This automatically filters chat to that specific context. |
| `theme` | No | `light` or `dark`. |
| `primaryColor`| No | Hex color code for buttons and highlights (e.g., `#007bff`). |

## Context-Aware Threading

If you provide a `contextId`, the widget will:
1. Search for an existing thread in the specified channel with that context ID.
2. If found, load only that thread.
3. If not found, show an empty state and create the thread automatically when the first message is sent.

This allows you to have "Chat about this Invoice" functionality without managing thread IDs in your parent application.

## Rich Document Embeds (Linking Docs)

You can send "document" type messages via the API V2 to show rich cards in the chat.

### API Example (V2)

```bash
curl -X POST https://your-messaging-platform.com/api/v2/workspaces/[slug]/messages \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "[channel_id]",
    "content": "Check out this invoice",
    "contextId": "invoice-123",
    "metadata": {
      "documentTitle": "Invoice #123",
      "documentType": "PDF",
      "documentUrl": "https://your-erp.com/docs/inv-123.pdf",
      "documentId": "INV-123",
      "documentAmount": "$1,500.00",
      "documentStatus": "Pending"
    }
  }'
```

## Authentication flow

1. **Register Client**: Register your application as an OAuth2 client in the Messaging Platform settings.
2. **Authorize**: Have your user log in via OAuth2 to get an access token.
3. **Embed**: Pass the access token to the widget `token` parameter.

## Webhooks for Bi-directional Updates

Use Workspace Webhooks to receive notifications in your parent app when users reply in the chat.

1. Go to **Settings > Integrations > Webhooks**.
2. Add your callback URL.
3. Subscribe to `message.created` events.
4. When you receive an event, check the `thread.tags` to find your `contextId`.

---

Need help? Contact support@your-messaging-platform.com
