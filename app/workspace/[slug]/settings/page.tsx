import { Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Metadata } from "next"
import { GeneralTab } from "@/components/features/workspace/settings/general-tab"
import { MembersTab } from "@/components/features/workspace/settings/members-tab"
import { SecurityTab } from "@/components/features/workspace/settings/security-tab"
import { WorkspaceWebhooksManagement } from "@/components/features/workspace/workspace-webhooks-management"
import { NotificationsTab } from "@/components/features/workspace/settings/notifications-tab"
import { AuditLogsTab } from "@/components/features/workspace/settings/audit-log-tab"
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { IntegrationsTab } from "@/components/features/workspace/integrations-tab"

const getWorkspaceBySlug = cache(async (slug: string, userId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { 
      slug: slug 
    },
    include: {
      // Check membership to ensure security
      members: {
        where: { userId: userId }
      }
    }
  })

  // Return null if workspace doesn't exist OR user is not a member
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
  if (!session?.user) {
    return null // Or redirect to login
  }
  const workspace = await getWorkspaceBySlug(slug, session.user.id)

  if (!workspace) {
    return <div className="p-6">Workspace not found or access denied.</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Workspace Settings</h1>
            <p className="text-sm text-muted-foreground">Manage workspace configuration and integrations</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <GeneralTab workspace={workspace} />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <MembersTab workspaceId={workspace?.id} />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityTab workspaceId={workspace?.id} />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <IntegrationsTab workspaceId={workspace?.id} />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <WorkspaceWebhooksManagement workspaceSlug={workspace?.id} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationsTab workspaceId={workspace?.id} />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditLogsTab workspaceId={workspace?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
