# Recipe: Syncing Members

Large organizations often need to keep their Skyrme Chat workspace membership in sync with an external HR system or an Identity Provider (IdP).

## The Workflow

1. **Fetch current members** from Skyrme Chat.
2. **Compare** with your source of truth.
3. **Add** new employees who are missing.
4. **Remove** former employees or those who no longer need access.

## Implementation Guide

### 1. Get an Access Token
Ensure your Bot App has the `members:read` and `members:write` scopes.

### 2. Fetch Existing Members
Use the `GET /v2/workspaces/:slug/members` endpoint.

```javascript
const response = await axios.get(`https://api.skyrme.chat/v2/workspaces/${SLUG}/members`, {
  headers: { Authorization: `Bearer ${TOKEN}` }
});
const currentMembers = response.data.members;
```

### 3. Identify Changes
Map your HR system data to Skyrme Chat users by email address.

```javascript
const hrUsers = await getHRSystemUsers(); // Your internal logic

// Users to add
const toAdd = hrUsers.filter(u => !currentMembers.find(m => m.user.email === u.email));

// Users to remove
const toRemove = currentMembers.filter(m => !hrUsers.find(u => u.email === m.user.email));
```

### 4. Apply Updates

**Adding Members:**
```javascript
for (const user of toAdd) {
  await axios.post(`https://api.skyrme.chat/v2/workspaces/${SLUG}/members`, {
    email: user.email,
    role: 'member'
  }, { headers: { Authorization: `Bearer ${TOKEN}` } });
}
```

**Removing Members:**
```javascript
for (const member of toRemove) {
  await axios.delete(`https://api.skyrme.chat/v2/workspaces/${SLUG}/members/${member.user.id}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
}
```

## Best Practices

- **Dry Run**: Always implement a "dry run" mode in your sync script that logs intended changes without applying them.
- **Rate Limiting**: Be mindful of API rate limits when syncing thousands of users.
- **Error Handling**: Log failures for specific users (e.g., if a user doesn't exist in Skyrme Chat yet) without stopping the entire sync process.
