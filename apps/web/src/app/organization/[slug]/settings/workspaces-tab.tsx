'use client';

import { useOrganizationWorkspaces } from '@repo/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function WorkspacesTab({ orgSlug }: { orgSlug: string }) {
  const { data: workspaces, isLoading } = useOrganizationWorkspaces(orgSlug);

  if (isLoading) {
    return <div>Loading workspaces...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provisioned Workspaces</CardTitle>
        <CardDescription>
          View and manage workspaces provisioned for this organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaces?.map((workspace: any) => (
              <TableRow key={workspace.id}>
                <TableCell className="font-medium">{workspace.name}</TableCell>
                <TableCell>{workspace.slug}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {workspace._count?.members || 0}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="size-3.5" />
                    {workspace._count?.channels || 0}
                  </div>
                </TableCell>
                <TableCell>{new Date(workspace.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/workspace/${workspace.slug}`}>
                      <ExternalLink className="size-4 mr-2" />
                      Open
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!workspaces || workspaces.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No workspaces found for this organization.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
