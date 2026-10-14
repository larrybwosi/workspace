# M2M Provisioning & System Member Import Guide

When integrating your application or platform with Scrymechat, machine-to-machine (M2M) provisioning allows you to seamlessly automate workspace setup, user account creation, and member synchronization.

This guide covers how to quickly provision workspaces and bulk-import existing system users into your chat environment using our V3 API and `@scryme/chat` SDK.

---

## 1. Overview of Onboarding Workflows

The M2M provisioning flow is designed to eliminate setup friction for developers and end-users:

```
+--------------------------+          +---------------------------+          +--------------------------+
|  Integrating System/App  | -------> |   M2M Token Authentication| -------> |  Scrymechat V3 M2M API   |
+--------------------------+          +---------------------------+          +--------------------------+
            |                                                                             |
            +--- 1. Provision Workspace (slug, channels, owner) ------------------------->|
            +--- 2. Create / Pre-provision User Accounts -------------------------------->|
            +--- 3. Bulk Import Existing Members (email, name, avatar, role) ----------->|
```

### Key Highlights
- **Automated Workspace Provisioning**: Create fully-configured workspaces with custom branding, initial channels, and default system bots in a single call.
- **Richer User Onboarding**: Pass full names and avatar image URLs during workspace creation and member imports so user profiles look complete immediately.
- **Bulk Member Import Endpoint**: Import dozens or hundreds of users from your database, HR software, or auth directory without sending hundreds of individual requests.
- **Automatic Organization Membership**: System users imported via M2M are automatically linked to your organization.

---

## 2. Workspace Provisioning via M2M

To provision a new workspace programmatically, use `sdk.m2m.workspace.provision()` or `POST /api/v3/workspaces/provision`.

### TypeScript SDK Example

```typescript
import { ScrymeSDK } from '@scryme/chat';

const sdk = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  clientId: 'm2m_client_12345',
  clientSecret: 'sk_m2m_secret_67890',
});

// Provision a workspace with custom channels and initial team members
const response = await sdk.m2m.workspace.provision({
  name: 'Acme Product Team',
  slug: 'acme-product',
  ownerEmail: 'alice@acme.com',
  ownerName: 'Alice Vance',
  ownerAvatar: 'https://cdn.acme.com/avatars/alice.png',
  industry: 'Technology',
  description: 'Primary product collaboration workspace',
  channels: ['general', 'product-announcements', 'feedback'],
  initialMembers: [
    {
      email: 'bob@acme.com',
      name: 'Bob Smith',
      avatar: 'https://cdn.acme.com/avatars/bob.png',
      role: 'admin',
    },
    {
      email: 'charlie@acme.com',
      name: 'Charlie Brown',
      avatar: 'https://cdn.acme.com/avatars/charlie.png',
      role: 'member',
    },
  ],
});

console.log('Workspace ID:', response.data.workspace.id);
console.log('System Bot Client ID:', response.data.bot.clientId);
```

### cURL Example

```bash
curl -X POST https://api.chat.scryme.tech/api/v3/workspaces/provision \
  -H "Authorization: Bearer YOUR_M2M_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Product Team",
    "slug": "acme-product",
    "ownerEmail": "alice@acme.com",
    "ownerName": "Alice Vance",
    "ownerAvatar": "https://cdn.acme.com/avatars/alice.png",
    "channels": ["general", "announcements"],
    "initialMembers": [
      {
        "email": "bob@acme.com",
        "name": "Bob Smith",
        "role": "admin"
      }
    ]
  }'
```

---

## 3. Standalone User Provisioning

If you want to pre-provision user accounts before assigning them to specific workspaces or channels, use `sdk.user.create()` / `sdk.m2m.user.create()` or `POST /api/v3/users`.

### TypeScript SDK Example

```typescript
// Create or update a user account in the system
const userRes = await sdk.m2m.user.create({
  email: 'david@acme.com',
  name: 'David Wright',
  avatar: 'https://cdn.acme.com/avatars/david.png',
  organizationId: 'org_acme_corporate',
});

console.log('Provisioned User ID:', userRes.data.user.id);
```

### cURL Example

```bash
curl -X POST https://api.chat.scryme.tech/api/v3/users \
  -H "Authorization: Bearer YOUR_M2M_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "david@acme.com",
    "name": "David Wright",
    "avatar": "https://cdn.acme.com/avatars/david.png"
  }'
```

---

## 4. Importing Existing System Members (Bulk Import)

When integrating an existing platform (e.g., SaaS app, CRM, LMS, or HR tool), you often have a list of active users that need immediate access to a workspace.

Use `sdk.workspace.members.import()` or `POST /api/v3/workspaces/:slug/members/import` to batch import users.

### TypeScript SDK Example

```typescript
const importResult = await sdk.m2m.member.import('acme-product', {
  members: [
    {
      email: 'member1@acme.com',
      name: 'Evelyn Reed',
      avatar: 'https://cdn.acme.com/avatars/evelyn.png',
      role: 'member',
      externalId: 'ext_sys_usr_101',
    },
    {
      email: 'member2@acme.com',
      name: 'Frank Miller',
      avatar: 'https://cdn.acme.com/avatars/frank.png',
      role: 'member',
      externalId: 'ext_sys_usr_102',
    },
    {
      email: 'admin@acme.com',
      name: 'Grace Hopper',
      avatar: 'https://cdn.acme.com/avatars/grace.png',
      role: 'admin',
      externalId: 'ext_sys_usr_103',
    },
  ],
});

console.log('Successfully imported members:', importResult.data.importedCount);
```

### Response Payload Example

```json
{
  "success": true,
  "data": {
    "importedCount": 3,
    "members": [
      {
        "email": "member1@acme.com",
        "userId": "usr_abc123",
        "role": "member",
        "memberId": "wsm_xyz789",
        "externalId": "ext_sys_usr_101"
      },
      {
        "email": "member2@acme.com",
        "userId": "usr_abc124",
        "role": "member",
        "memberId": "wsm_xyz790",
        "externalId": "ext_sys_usr_102"
      },
      {
        "email": "admin@acme.com",
        "userId": "usr_abc125",
        "role": "admin",
        "memberId": "wsm_xyz791",
        "externalId": "ext_sys_usr_103"
      }
    ]
  }
}
```

---

## 5. Security & Scope Requirements

Ensure your M2M Client Application has been granted the appropriate OAuth scopes in your Organization settings:

| Endpoint | Required Scopes | Description |
| :--- | :--- | :--- |
| `POST /api/v3/workspaces/provision` | `provisioning:workspaces` or `*` | Workspace creation & initial setup |
| `POST /api/v3/workspaces/:slug/members/import` | `members:write` or `*` | Bulk member import |
| `POST /api/v3/users` | `users:write` or `members:write` or `*` | Standalone user creation |
| `GET /api/v3/users/by-email` | `users:read` or `members:read` or `*` | User lookup by email |

---

## 6. Next Steps

- Explore the [Sync Members Developer Recipe](/api-reference/recipe-sync-members) for continuous directory synchronization.
- Learn more about [Channel Incoming Webhooks](/api-reference/incoming-webhooks) for automated posting from external tools.
