'use client';

import { useOrganizationWorkspaces } from '@repo/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Users, MessageSquare, Building2 } from 'lucide-react';
import Link from 'next/link';

export function WorkspacesTab({ orgSlug }: { orgSlug: string }) {
  const { data: workspaces, isLoading } = useOrganizationWorkspaces(orgSlug);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provisioned workspaces</CardTitle>
        <CardDescription>
          View and manage workspaces provisioned for this organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <WorkspacesTableSkeleton />
              ) : !workspaces || workspaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Building2 className="size-8" />
                      <p className="text-sm font-medium text-foreground">No workspaces yet</p>
                      <p className="text-xs">Workspaces provisioned for this organization will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                workspaces.map((workspace: any) => (
                  <TableRow key={workspace.id}>
                    <TableCell className="font-medium">{workspace.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{workspace.slug}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="size-3.5" />
                        <span className="text-foreground">{workspace._count?.members || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="size-3.5" />
                        <span className="text-foreground">{workspace._count?.channels || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(workspace.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/workspace/${workspace.slug}`}>
                          <ExternalLink className="size-4" />
                          Open
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkspacesTableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-8 w-16 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
