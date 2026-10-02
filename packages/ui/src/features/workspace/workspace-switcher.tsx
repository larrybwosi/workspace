'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWorkspaces } from '@repo/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu';
import { Button } from '../../components/button';
import { Badge } from '../../components/badge';
import { ChevronDown, Plus, Settings, Check, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CreateWorkspaceDialog } from './create-workspace-dialog';
import { WorkspaceIcon } from '../../components/workspace-icon';

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
  onWorkspaceSelect?: (workspaceId: string) => void;
  className?: string;
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
  onWorkspaceSelect,
  className,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const params = useParams();
  const activeSlug = (params?.slug as string) || currentWorkspaceId;
  const { data: workspaces, isLoading } = useWorkspaces();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const currentWorkspace = workspaces?.find(
    (w) => w.id === activeSlug || w.slug === activeSlug
  ) || workspaces?.[0];

  const handleWorkspaceChange = (slug: string) => {
    if (onWorkspaceSelect) {
      onWorkspaceSelect(slug);
    } else {
      router.push(`/workspace/${slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('h-10 w-full animate-pulse bg-muted rounded-md', className)} />
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-between h-12 px-3 hover:bg-muted/50 data-[state=open]:bg-muted/50',
              className
            )}
          >
            <div className="flex items-center gap-3 text-left overflow-hidden">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                <WorkspaceIcon icon={currentWorkspace?.icon} name={currentWorkspace?.name || 'Workspace'} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </span>
                  {currentWorkspace?.plan === 'pro' && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-amber-500/10 text-amber-500 border-amber-500/20">
                      PRO
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {currentWorkspace?.memberCount ? `${currentWorkspace.memberCount} members` : 'Workspace'}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64" align="start">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {workspaces?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>No workspaces yet</p>
              <p className="text-xs">Create one to get started</p>
            </div>
          ) : (
            <DropdownMenuGroup className="max-h-64 overflow-auto">
              {workspaces?.map((workspace: any) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceChange(workspace.slug)}
                  className={cn(
                    'cursor-pointer py-2',
                    (currentWorkspaceId === workspace.id || currentWorkspaceId === workspace.slug || activeSlug === workspace.slug) && 'bg-muted'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                      <WorkspaceIcon icon={workspace.icon} name={workspace.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate flex items-center gap-1.5">
                        {workspace.name}
                        {workspace.plan === 'pro' && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            PRO
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {workspace.slug}
                      </div>
                    </div>
                    {(currentWorkspaceId === workspace.id || currentWorkspaceId === workspace.slug || activeSlug === workspace.slug) && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            className="cursor-pointer text-primary focus:text-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Workspace</span>
          </DropdownMenuItem>

          {currentWorkspace && (
            <DropdownMenuItem
              onClick={() => router.push(`/workspace/${currentWorkspace.slug}/settings`)}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Workspace Settings</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
