'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useOrganization } from '@repo/api-client';
import { Sidebar } from '@/components/layout/sidebar';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, LayoutGrid, KeySquare, Settings as SettingsIcon, TriangleAlert } from 'lucide-react';
import { WorkspacesTab } from './workspaces-tab';
import { M2mTab } from './m2m-tab';
import { GeneralTab as OrganizationGeneralTab } from '@repo/ui';

export default function OrganizationSettingsClient() {
  const params = useParams();
  const orgSlug = params?.slug as string;
  const { data: organization, isLoading } = useOrganization(orgSlug);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('workspaces');

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
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          onSearchClick={() => {}}
        />
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {isLoading ? (
              <OrganizationHeaderSkeleton />
            ) : !organization ? (
              <OrganizationNotFound />
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Building2 className="size-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
                      <p className="text-muted-foreground">
                        Manage your organization's workspaces and programmatic access
                      </p>
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
                      M2M applications
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
                    <OrganizationGeneralTab orgSlug={orgSlug} />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function OrganizationHeaderSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex gap-1 rounded-md bg-muted/50 p-1 w-fit">
          <Skeleton className="h-8 w-28 rounded-sm" />
          <Skeleton className="h-8 w-36 rounded-sm" />
          <Skeleton className="h-8 w-24 rounded-sm" />
        </div>
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganizationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <TriangleAlert className="size-6" />
      </div>
      <div>
        <p className="font-medium">Organization not found</p>
        <p className="text-sm text-muted-foreground">
          Check the URL, or confirm you still have access to this organization.
        </p>
      </div>
    </div>
  );
}
