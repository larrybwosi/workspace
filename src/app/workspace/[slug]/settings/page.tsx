import { Metadata } from "next"
import { cache } from "react"
import { prisma } from "@/lib/db/prisma"
import WorkspaceSettingsPageClient from "./client"

const getWorkspaceBySlug = cache(async (slug: string, userId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { 
      slug: slug 
    },
    include: {
      members: {
        where: { userId: userId }
      }
    }
  })

  if (!workspace || workspace.members.length === 0) {
    return null
  }

  return workspace
})

export const metadata: Metadata = {
  title: "Workspace Settings",
  description: "Manage workspace settings and integrations",
}

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await import("@/lib/auth").then(async (mod) => mod.auth.api.getSession({ headers: await import("next/headers").then((h) => h.headers()) }))

  let workspace = null;
  if (session?.user) {
    workspace = await getWorkspaceBySlug(slug, session.user.id)
  }

  return <WorkspaceSettingsPageClient workspace={workspace} />
}
