# M2M Integration Guide

Machine-to-Machine (M2M) integration allows your organization's backend systems to interact with the API autonomously. This is ideal for provisioning tenants, sending system updates, and managing bots at scale.

## Getting Started

### 1. Create an M2M Application
Go to your Organization settings and create a new M2M application. You will receive a `client_id` and `client_secret`.

### 2. Obtain an Access Token
Exchange your credentials for a Bearer token using the OAuth2 Client Credentials grant:

```bash
curl -X POST https://api.yourdomain.com/v2/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "scope": "provisioning:workspaces messages:send"
  }'
```

## Provisioning Tenants

You can provision new workspaces (tenants) for your organization using the Provisioning API:

```bash
curl -X POST https://api.yourdomain.com/v2/provisioning/workspace \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tenant A",
    "slug": "tenant-a",
    "ownerEmail": "admin@tenant-a.com",
    "channels": ["general", "announcements"]
  }'
```

When a workspace is provisioned via M2M, a **Default Bot** is automatically created and added to the workspace. This bot will be used as the sender for any subsequent M2M messages.

## Sending System Updates

M2M applications can send messages to any channel within their organization's workspaces. These messages will appear as coming from the workspace's default bot.

```bash
curl -X POST https://api.yourdomain.com/v2/workspaces/tenant-a/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "CHANNEL_ID",
    "content": "🚀 System Update: Version 2.0 is now live!"
  }'
```

## Security Best Practices

- **IP Whitelisting**: Restrict your M2M application to specific IP addresses in the organization settings.
- **Granular Scopes**: Only request the scopes your application strictly needs.
- **Secret Management**: Never expose your `client_secret` in client-side code. Use environment variables in your backend.
