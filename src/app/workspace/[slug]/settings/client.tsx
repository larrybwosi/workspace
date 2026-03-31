"use client";

import { Settings, Link as LinkIcon, Menu } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralTab } from "@/components/features/workspace/settings/general-tab"
import { MembersTab } from "@/components/features/workspace/settings/members-tab"
import { SecurityTab } from "@/components/features/workspace/settings/security-tab"
import { WorkspaceWebhooksManagement } from "@/components/features/workspace/workspace-webhooks-management"
import { NotificationsTab } from "@/components/features/workspace/settings/notifications-tab"
import { AuditLogsTab } from "@/components/features/workspace/settings/audit-log-tab"
import { IntegrationsTab } from "@/components/features/workspace/settings/integrations-tab"
import { WorkspaceInviteLinks } from "@/components/features/workspace/workspace-invite-links"
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar"
import { InfoPanel } from "@/components/shared/info-panel"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { useState } from "react"
import { useWorkspaces } from "@/hooks/api/use-workspaces"
import { useParams } from "next/navigation"

export default function WorkspaceSettingsPageClient({
  workspace,
}: {
  workspace: any
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const { slug } = useParams()
  const { data: workspaces, isLoading } = useWorkspaces()

  const currentWorkspace = workspace || workspaces?.find((w: any) => w.slug === slug)

  if (!currentWorkspace && !isLoading) {
    return <div className="p-6">Workspace not found or access denied.</div>
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentWorkspaceId={currentWorkspace?.id}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DynamicHeader
          activeView="Settings"
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
          onInfoClick={() => setInfoPanelOpen((prev) => !prev)}
        />
        <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
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

          <div className="p-6">
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="invites">Invite Links</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <GeneralTab workspace={currentWorkspace} />
              </TabsContent>

              <TabsContent value="members" className="space-y-6">
                <MembersTab workspaceId={currentWorkspace?.id} />
              </TabsContent>

              <TabsContent value="invites" className="space-y-6">
                <WorkspaceInviteLinks workspaceId={currentWorkspace?.id} />
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <SecurityTab workspaceId={currentWorkspace?.id} />
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6">
                <IntegrationsTab workspaceId={currentWorkspace?.id} />
              </TabsContent>

              <TabsContent value="webhooks" className="space-y-6">
                <WorkspaceWebhooksManagement workspaceSlug={currentWorkspace?.id} />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <NotificationsTab workspaceId={currentWorkspace?.id} />
              </TabsContent>

              <TabsContent value="audit" className="space-y-6">
                <AuditLogsTab workspaceId={currentWorkspace?.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        {infoPanelOpen && (
            <aside className="w-[350px] shrink-0 border-l border-border bg-background h-full transition-all duration-300 ease-in-out hidden lg:block">
                <InfoPanel
                    isOpen={infoPanelOpen}
                    onClose={() => setInfoPanelOpen(false)}
                    type="workspace"
                />
            </aside>
        )}
        </div>
      </main>
    </div>
  )
}
