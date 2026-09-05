# Inviting & Managing Members

Expand your team by inviting colleagues, collaborators, or external partners into your Scrymechat workspace.

---

## 1. How to Invite Members

Workspace Administrators and Team Leads can send email invitations or generate shareable invite links.

### Step-by-step Instructions

1. Click your **Workspace Name** in the top left corner of the sidebar.
2. Click **Invite People** from the dropdown menu.
3. Enter one or multiple email addresses separated by commas.
4. Select the initial **Workspace Role**:
   - `Admin`: Full access to workspace settings, billing, and member management.
   - `Member`: Standard access to create channels, send messages, and join calls.
   - `Guest`: Restricted access to specific assigned channels only.
5. Select default channels/teams for new members to join automatically.
6. Click **Send Invitations**.

> SUCCESS: Invites will be emailed immediately with a direct sign-up link.

---

## 2. Managing Pending Invitations

Track pending invites, resend invitation emails, or revoke access before a user accepts.

1. Go to **Workspace Settings** > **Members**.
2. Click the **Pending Invitations** tab.
3. Next to any pending invite:
   - Click **Resend Email** to dispatch a reminder.
   - Click **Revoke** to cancel the invitation link permanently.

---

## 3. Bulk CSV Import

For large enterprise deployments, you can invite hundreds of members at once using a CSV file.

### CSV Format Example
```csv
email,role,channels
alice@acme.com,member,general;engineering
bob@acme.com,admin,general;leadership
carol@acme.com,guest,general;support
```

1. Go to **Workspace Settings** > **Members** > **Bulk Import**.
2. Upload your `.csv` file.
3. Review the parsed member table and click **Confirm & Send All**.

---

## Member Roles & Permissions Summary

| Permission | Owner | Admin | Member | Guest |
| :--- | :---: | :---: | :---: | :---: |
| Manage Workspace Settings | ✅ | ✅ | ❌ | ❌ |
| Invite New Members | ✅ | ✅ | ✅ | ❌ |
| Create Public Channels | ✅ | ✅ | ✅ | ❌ |
| Manage Webhooks & Bots | ✅ | ✅ | ❌ | ❌ |
| Access Assigned Channels Only | ❌ | ❌ | ❌ | ✅ |
