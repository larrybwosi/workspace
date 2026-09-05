# Joining a Workspace

Welcome to Scrymechat! Workspaces are isolated collaboration hubs where teams, channels, and messages live. You can join a workspace through an email invitation, a shared invite link, or SSO provisioned by your workspace administrator.

---

## 1. Joining via Email Invitation

When a workspace admin or team lead invites you, you will receive an invitation email from Scrymechat.

### Step-by-step Instructions

1. Check your email inbox for an invitation from Scrymechat.
2. Click the **Join Workspace** button in the email.
3. If you do not have a Scrymechat account, you will be prompted to create one using your invited email address.
4. If you already have an account, sign in to accept the invitation.
5. Once authenticated, you will automatically enter the workspace home view and default channels (`#general` and `#announcements`).

> SUCCESS: You are now a member of the workspace! You can start introducing yourself in `#general`.

---

## 2. Joining via Invite Link

Workspaces can generate shareable invite links for rapid team onboarding.

### Step-by-step Instructions

1. Click the invite link provided by your team lead or administrator.
2. The browser will open a preview displaying the workspace name, logo, and active member count.
3. Click **Accept Invitation & Join**.
4. Log in or create your account to finalize joining.

> TIP: If your organization uses Single Sign-On (SSO) with Google or GitHub, use the "Sign in with Google/GitHub" option to log in instantly!

---

## 3. Workspace SSO & Domain Auto-Join

Workspaces configured with domain auto-join allow anyone with a matching email domain (e.g. `@acme.com`) to join automatically.

1. Navigate to `https://app.chat.scryme.tech`.
2. Enter your work email address.
3. Select your company's workspace from the detected domain list.
4. Authenticate via your company's Identity Provider (IdP) to access the workspace.

---

## Troubleshooting Workspace Access

| Problem | Root Cause | Solution |
| :--- | :--- | :--- |
| **"Invite Link Expired"** | Links can have expiration limits or max uses. | Ask a workspace admin to generate a fresh invite link. |
| **"Email Domain Not Allowed"** | Invited with an email address not matching workspace domain policy. | Use your official work email address or request an explicit invite. |
| **"Workspace Not Found"** | The workspace may have been renamed or archived. | Contact support or your administrator to confirm the workspace slug. |
