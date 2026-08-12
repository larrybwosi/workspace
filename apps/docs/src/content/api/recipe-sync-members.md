# Recipe: Syncing Members

Large organizations often need to keep their Scrymechat workspace membership in sync with an external HR system or an Identity Provider (IdP).

## The Workflow

1. **Fetch current members** from Scrymechat.
2. **Compare** with your source of truth.
3. **Add** new employees who are missing.
4. **Remove** former employees or those who no longer need access.

## Implementation Guide

### 1. Initialize the `@scryme/chat` SDK

Ensure your Bot App has been granted the `members:read` and `members:write` scopes. Initialize the SDK with either your M2M credentials or your access token:

```typescript
import { ScrymeSDK } from '@scryme/chat';

const sdk = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
});
```

### 2. Fetch Existing Members

Use the fluent workspace members list helper to fetch the current workspace members:

```typescript
const result = await sdk.workspace.members.list(SLUG);
const currentMembers = result.data.members;
```

### 3. Identify Changes

Compare the Scryme workspace membership list against your HR system (your source of truth) by matching email addresses:

```typescript
const hrUsers = await getHRSystemUsers(); // Your internal logic

// Users to add (present in HR system, but missing in Scryme)
const toAdd = hrUsers.filter(u => !currentMembers.find(m => m.user.email === u.email));

// Users to remove (present in Scryme, but no longer in HR system)
const toRemove = currentMembers.filter(m => !hrUsers.find(u => u.email === m.user.email));
```

### 4. Apply Updates

Iterate over the changes and invoke the SDK's members addition and deletion methods to apply the synchronization.

**Adding Members:**

```typescript
for (const user of toAdd) {
  await sdk.workspace.members.add(SLUG, {
    email: user.email,
    role: 'member',
  });
}
```

**Removing Members:**

```typescript
for (const member of toRemove) {
  await sdk.workspace.members.delete(SLUG, member.user.id);
}
```

## Best Practices

- **Dry Run**: Always implement a "dry run" mode in your sync script that logs intended changes without applying them.
- **Rate Limiting**: Be mindful of API rate limits when syncing thousands of users.
- **Error Handling**: Log failures for specific users (e.g., if a user doesn't exist in Scrymechat yet) without stopping the entire sync process.
