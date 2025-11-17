import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { getInvitationSEOMetadata } from "@/lib/invitation-utils"
import InviteAcceptForm from "@/components/invite-accept-form"

export async function generateMetadata({
  params,
}: {
  params: { token: string }
}): Promise<Metadata> {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
    })

    if (!invitation) {
      return {
        title: "Invitation Not Found",
        description: "This invitation link is invalid or has expired.",
      }
    }

    const inviter = await prisma.user.findUnique({
      where: { id: invitation.invitedBy },
      select: { name: true },
    })

    let projectName: string | undefined
    if (invitation.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: invitation.projectId },
        select: { name: true },
      })
      projectName = project?.name
    }

    return getInvitationSEOMetadata(inviter?.name || "A team member", projectName)
  } catch (error) {
    console.error(" Error generating metadata:", error)
    return {
      title: "Invitation",
      description: "Accept your invitation to join the team.",
    }
  }
}

export default function InvitePage({ params }: { params: { token: string } }) {
  return <InviteAcceptForm token={params.token} />
}
