# Recipe: Bulk Importing System Members via M2M

This recipe demonstrates how to quickly import active members from an existing web or mobile application into Scrymechat workspaces using M2M client credentials.

## When to Use Bulk Import

- **Initial App Onboarding**: You are launching Scrymechat for an existing user base and want every existing user to have an active chat profile.
- **Tenant Migration**: You are provisioning new client workspace tenants and need to sync team accounts from your database.
- **Batch Directory Sync**: Running periodic scripts to onboard newly registered users from your CRM or database in batches.

---

## Step 1: Initialize the `@scryme/chat` SDK

Initialize the SDK using your Organization M2M Credentials (`clientId` and `clientSecret`). The SDK will automatically fetch and manage OAuth Bearer tokens.

```typescript
import { ScrymeSDK } from '@scryme/chat';

const sdk = new ScrymeSDK({
  baseURL: process.env.SCRYME_API_URL || 'https://api.chat.scryme.tech',
  clientId: process.env.SCRYME_CLIENT_ID,
  clientSecret: process.env.SCRYME_CLIENT_SECRET,
});
```

---

## Step 2: Extract User Data from Your Database

Fetch your application's user directory from your local database or identity provider:

```typescript
interface AppUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
}

async function getIntegratingSystemUsers(): Promise<AppUser[]> {
  // Replace with your actual ORM or database query
  return [
    {
      id: 'usr_db_001',
      email: 'sara@example.com',
      fullName: 'Sara Connor',
      avatarUrl: 'https://cdn.example.com/avatars/sara.jpg',
      role: 'admin',
    },
    {
      id: 'usr_db_002',
      email: 'alex@example.com',
      fullName: 'Alex Murphy',
      avatarUrl: 'https://cdn.example.com/avatars/alex.jpg',
      role: 'member',
    },
  ];
}
```

---

## Step 3: Execute Bulk Import

Map your user objects to the `@scryme/chat` import interface and call `sdk.m2m.member.import()`:

```typescript
async function importUsersToWorkspace(workspaceSlug: string) {
  const users = await getIntegratingSystemUsers();

  const importPayload = {
    members: users.map(user => ({
      email: user.email,
      name: user.fullName,
      avatar: user.avatarUrl,
      role: user.role,
      externalId: user.id,
    })),
  };

  const response = await sdk.m2m.member.import(workspaceSlug, importPayload);

  console.log(`Successfully imported ${response.data.importedCount} members into ${workspaceSlug}.`);
  console.log('Imported details:', response.data.members);
}

// Run the import script
importUsersToWorkspace('acme-workspace');
```

---

## Best Practices

1. **Batching Large Datasets**: If you have thousands of users, split your dataset into chunks of 100-200 members per request to optimize processing time.
2. **Idempotency**: Calling `import` multiple times with the same user email addresses is safe. It will update names/avatars if modified and preserve workspace roles without duplicating accounts.
3. **External ID Mapping**: Store `externalId` in the request to easily correlate chat user IDs with your internal database records.
