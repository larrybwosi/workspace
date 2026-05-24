'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useOrganization } from '@repo/api-client';
import { Sidebar } from '@/components/layout/sidebar';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, LayoutGrid, KeySquare, Settings as SettingsIcon } from 'lucide-react';
import { WorkspacesTab } from './workspaces-tab';
import { M2mTab } from './m2m-tab';

export default function OrganizationSettingsClient() {
  const params = useParams();
  const orgSlug = params?.slug as string;
  const { data: organization, isLoading } = useOrganization(orgSlug);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('workspaces');

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading organization...</div>;
  }

  if (!organization) {
    return <div className="flex h-screen items-center justify-center">Organization not found</div>;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel=""
        onChannelSelect={() => {}}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DynamicHeader
          activeView="Organization Settings"
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="size-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
                  <p className="text-muted-foreground">Manage your organization's workspaces and programmatic access</p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="workspaces" className="flex items-center gap-2">
                  <LayoutGrid className="size-4" />
                  Workspaces
                </TabsTrigger>
                <TabsTrigger value="m2m" className="flex items-center gap-2">
                  <KeySquare className="size-4" />
                  M2M Applications
                </TabsTrigger>
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <SettingsIcon className="size-4" />
                  General
                </TabsTrigger>
              </TabsList>

              <TabsContent value="workspaces" className="space-y-4">
                <WorkspacesTab orgSlug={orgSlug} />
              </TabsContent>

              <TabsContent value="m2m" className="space-y-4">
                <M2mTab orgSlug={orgSlug} />
              </TabsContent>

              <TabsContent value="general" className="space-y-4">
                <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                  Organization profile settings coming soon.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
