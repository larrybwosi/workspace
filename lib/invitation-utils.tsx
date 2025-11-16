import { nanoid } from "nanoid"

export interface InvitationData {
  email: string
  role?: string
  projectId?: string
  channelId?: string
  permissions?: Record<string, boolean>
  invitedBy: string
}

export function generateInvitationToken(): string {
  return nanoid(32)
}

export function generateInvitationLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${baseUrl}/invite/${token}`
}

export function getInvitationExpiry(): Date {
  // Default: 7 days from now
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 7)
  return expiry
}

export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt)
}

export async function sendInvitationEmail(
  email: string,
  invitationLink: string,
  inviterName: string,
  projectName?: string,
) {
  // TODO: Implement email sending logic with your email provider
  // This is a placeholder that logs the invitation details
  console.log("[v0] Sending invitation email:", {
    to: email,
    invitationLink,
    inviterName,
    projectName,
  })

  // Example: Use Resend, SendGrid, or any email service
  // await resend.emails.send({
  //   from: 'noreply@yourapp.com',
  //   to: email,
  //   subject: `${inviterName} invited you to collaborate`,
  //   html: getInvitationEmailTemplate(invitationLink, inviterName, projectName)
  // })
}

export function getInvitationEmailTemplate(invitationLink: string, inviterName: string, projectName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${inviterName}</strong> has invited you to join ${projectName ? `the <strong>${projectName}</strong> project` : "their team"} on our collaboration platform.
          </p>
          
          <p style="margin-bottom: 25px;">
            Get started with powerful features including:
          </p>
          
          <ul style="margin-bottom: 25px; padding-left: 20px;">
            <li>Real-time messaging and collaboration</li>
            <li>Project management with Kanban boards</li>
            <li>Enterprise note-taking with Obsidian-style linking</li>
            <li>Time tracking and sprint management</li>
            <li>Custom integrations and webhooks</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 25px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${invitationLink}" style="color: #667eea; word-break: break-all;">${invitationLink}</a>
          </p>
        </div>
      </body>
    </html>
  `
}

export function getInvitationSEOMetadata(inviterName: string, projectName?: string) {
  const title = projectName
    ? `Join ${projectName} - Invitation from ${inviterName}`
    : `Join ${inviterName}'s Team - Collaboration Platform Invitation`

  const description = projectName
    ? `${inviterName} has invited you to collaborate on ${projectName}. Accept your invitation to access real-time messaging, project management, note-taking, and more enterprise features.`
    : `${inviterName} has invited you to join their team. Accept your invitation to start collaborating with real-time messaging, project management, and enterprise note-taking tools.`

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: [
        {
          url: "/og-invitation.png", // TODO: Create this image
          width: 1200,
          height: 630,
          alt: "Collaboration Platform Invitation",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-invitation.png"],
    },
  }
}
