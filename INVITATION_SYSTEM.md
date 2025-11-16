# Invitation System Documentation

## Overview

The invitation system allows existing users to invite new team members to join the platform. The system includes email invitations, secure token-based registration, and comprehensive SEO optimization for social media sharing.

## Features

- Email-based invitations with secure tokens
- 7-day expiration period for invitations
- Project and channel-specific invitations
- Invitation tracking and resending
- SEO-optimized invitation pages with Open Graph meta tags
- Beautiful invitation acceptance flow

## API Endpoints

### Create Invitation
\`\`\`
POST /api/invitations
\`\`\`

**Request Body:**
\`\`\`json
{
  "email": "newuser@example.com",
  "role": "member",
  "projectId": "project_123" // optional
  "channelId": "channel_456", // optional
  "permissions": {} // optional
}
\`\`\`

**Response:**
\`\`\`json
{
  "invitation": {
    "id": "inv_123",
    "email": "newuser@example.com",
    "token": "abc123...",
    "status": "pending",
    "expiresAt": "2024-01-20T00:00:00Z"
  },
  "invitationLink": "https://yourapp.com/invite/abc123..."
}
\`\`\`

### Get Invitation Details
\`\`\`
GET /api/invitations/:token
\`\`\`

### Accept Invitation
\`\`\`
POST /api/invitations/:token/accept
\`\`\`

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "password": "secure_password"
}
\`\`\`

### List Invitations
\`\`\`
GET /api/invitations?status=pending
\`\`\`

### Resend Invitation
\`\`\`
POST /api/invitations/:token/resend
\`\`\`

## Usage Examples

### Creating an Invitation

\`\`\`typescript
import { useCreateInvitation } from '@/hooks/api/use-invitations'

function InviteButton() {
  const createInvitation = useCreateInvitation()

  const handleInvite = async () => {
    const result = await createInvitation.mutateAsync({
      email: 'colleague@example.com',
      projectId: 'project_123'
    })
    
    console.log('Invitation link:', result.invitationLink)
  }

  return <button onClick={handleInvite}>Invite User</button>
}
\`\`\`

### Accepting an Invitation

Users receive an email with a link like: `https://yourapp.com/invite/abc123...`

The invitation page:
1. Displays who invited them
2. Shows project details (if applicable)
3. Provides a signup form
4. Creates their account and adds them to the project/channel

## SEO Optimization

The invitation pages are optimized for social media sharing with:

### Open Graph Tags
- Title: "Join {Project} - Invitation from {User}"
- Description: Detailed invitation context
- Image: 1200x630 preview image
- Type: website

### Twitter Cards
- Card type: summary_large_image
- Same title and description as OG
- Preview image for rich cards

### Meta Tags
- Proper canonical URLs
- Mobile-responsive viewport
- Description for search engines

## Email Templates

The system includes a beautiful HTML email template with:
- Gradient header design
- Feature highlights
- Clear call-to-action button
- Expiration notice
- Fallback text link

## Security Features

- Secure token generation (32-character nanoid)
- Token expiration (7 days)
- One-time use tokens
- Email verification on acceptance
- Rate limiting on API endpoints
- Duplicate invitation prevention

## Customization

### Changing Expiration Time

Edit `lib/invitation-utils.ts`:

\`\`\`typescript
export function getInvitationExpiry(): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 14) // Change to 14 days
  return expiry
}
\`\`\`

### Custom Email Provider

Implement email sending in `lib/invitation-utils.ts`:

\`\`\`typescript
export async function sendInvitationEmail(...) {
  // Use your email provider
  await resend.emails.send({
    from: 'noreply@yourapp.com',
    to: email,
    subject: `${inviterName} invited you`,
    html: getInvitationEmailTemplate(...)
  })
}
\`\`\`

### Custom Invitation Logic

Add custom logic in the API routes:
- `app/api/invitations/route.ts` - Create invitation
- `app/api/invitations/[token]/route.ts` - Accept invitation

## Database Schema

The system uses two models:

### Invitation
- id, email, token (unique)
- role, permissions
- invitedBy, projectId, channelId
- status, expiresAt, acceptedAt
- timestamps

### InvitationLog
- Track all invitation actions
- sent, resent, accepted, expired

## Best Practices

1. **Always validate email addresses** before creating invitations
2. **Check for existing users** to avoid duplicate accounts
3. **Log all invitation actions** for audit trail
4. **Set appropriate permissions** based on role
5. **Monitor invitation acceptance rates** to improve onboarding
6. **Clean up expired invitations** periodically
7. **Use transaction** when accepting invitations to ensure data consistency

## Testing

Test the invitation flow:

1. Create invitation via API
2. Copy invitation link
3. Open link in incognito window
4. Accept invitation with valid credentials
5. Verify user account creation
6. Verify project/channel membership

## Troubleshooting

### Invitation not found
- Check token is correct
- Verify invitation hasn't expired
- Check database for invitation record

### Email not sent
- Verify email provider configuration
- Check API keys and environment variables
- Review email service logs

### Duplicate user error
- User may already have an account
- Invite them to the project directly instead
- Or use "Add Member" functionality

## Future Enhancements

- Bulk invitations
- Custom invitation templates
- Role-based invitation limits
- Invitation analytics dashboard
- SMS invitations
- Social media invitations
