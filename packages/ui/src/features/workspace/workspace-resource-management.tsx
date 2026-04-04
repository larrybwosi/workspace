"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Hash, Users, FolderKanban, Building } from "lucide-react"

interface WorkspaceResourceManagementProps {
  workspaceSlug: string
}

export function WorkspaceResourceManagement({ workspaceSlug }: WorkspaceResourceManagementProps) {
  return (
    <Tabs defaultValue="channels" className="space-y-6">
      <TabsList>
        <TabsTrigger value="channels">
          <Hash className="mr-2 size-4" />
          Channels
        </TabsTrigger>
        <TabsTrigger value="departments">
          <Building className="mr-2 size-4" />
          Departments
        </TabsTrigger>
        <TabsTrigger value="projects">
          <FolderKanban className="mr-2 size-4" />
          Projects
        </TabsTrigger>
        <TabsTrigger value="groups">
          <Users className="mr-2 size-4" />
          User Groups
        </TabsTrigger>
      </TabsList>

      <TabsContent value="channels">
        <Card>
          <CardHeader>
            <CardTitle>Manage Channels via Webhooks</CardTitle>
            <CardDescription>Create, update, or delete channels using webhook endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Create Channel</h3>
                <code className="block rounded bg-muted p-2 font-mono text-xs">
                  POST /api/workspaces/{`{workspaceId}`}/webhook/channels
                </code>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Update Channel</h3>
                <code className="block rounded bg-muted p-2 font-mono text-xs">
                  PATCH /api/workspaces/{`{workspaceId}`}/webhook/channels/{`{channelId}`}
                </code>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Delete Channel</h3>
                <code className="block rounded bg-muted p-2 font-mono text-xs">
                  DELETE /api/workspaces/{`{workspaceId}`}/webhook/channels/{`{channelId}`}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="departments">
        <Card>
          <CardHeader>
            <CardTitle>Manage Departments via Webhooks</CardTitle>
            <CardDescription>Create, update, or delete departments using webhook endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Department management endpoints with full CRUD operations</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="projects">
        <Card>
          <CardHeader>
            <CardTitle>Manage Projects via Webhooks</CardTitle>
            <CardDescription>Create, update, or delete projects using webhook endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Project management endpoints with full CRUD operations</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="groups">
        <Card>
          <CardHeader>
            <CardTitle>Manage User Groups via Webhooks</CardTitle>
            <CardDescription>Create, update, or delete user groups using webhook endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">User group management endpoints with full CRUD operations</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
