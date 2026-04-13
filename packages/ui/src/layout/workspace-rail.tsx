'use client';

import * as React from 'react';
import { Plus, Home, Search, Settings, HelpCircle, LogOut, Moon, Sun } from 'lucide-react';
import { useWorkspaces } from '@repo/api-client';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { Button } from '../components/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../components/avatar';
import { useSession } from '@repo/shared';
import { useTheme } from 'next-themes';

interface WorkspaceRailProps {
  onPlusClick?: () => void;
}

export function WorkspaceRail({ onPlusClick }: WorkspaceRailProps) {
  const { data: workspaces } = useWorkspaces();
  const { slug } = useParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-[72px] flex flex-col items-center py-4 bg-sidebar border-r border-sidebar-border shrink-0 z-50">
        {/* App Logo / Home */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-2xl mb-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
              onClick={() => router.push('/')}
            >
              <span className="text-2xl font-black">C</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Home</TooltipContent>
        </Tooltip>

        <div className="w-8 h-[2px] bg-sidebar-border rounded-full mb-4" />

        {/* Workspace List */}
        <div className="flex-1 flex flex-col items-center gap-3 w-full overflow-y-auto no-scrollbar">
          {workspaces?.map((workspace: any) => {
            const isActive = slug === workspace.slug;
            return (
              <Tooltip key={workspace.id}>
                <TooltipTrigger asChild>
                  <div className="relative group">
                    <div
                      className={cn(
                        'absolute -left-4 top-1/2 -translate-y-1/2 w-2 bg-foreground rounded-r-full transition-all duration-200',
                        isActive ? 'h-8' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-4'
                      )}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-12 w-12 rounded-2xl transition-all duration-200 active:scale-95 overflow-hidden border-2',
                        isActive
                          ? 'border-foreground rounded-xl shadow-lg'
                          : 'border-transparent hover:rounded-xl hover:bg-sidebar-accent'
                      )}
                      onClick={() => router.push(`/workspace/${workspace.slug}`)}
                    >
                      {workspace.icon ? (
                        <span className="text-xl">{workspace.icon}</span>
                      ) : (
                        <span className="font-bold text-sm">{workspace.name.charAt(0).toUpperCase()}</span>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{workspace.name}</TooltipContent>
              </Tooltip>
            );
          })}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-2xl border-2 border-dashed border-sidebar-border hover:border-sidebar-foreground/50 hover:rounded-xl transition-all active:scale-95"
                onClick={onPlusClick}
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Add Workspace</TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Toggle Theme</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative cursor-pointer group p-0.5 rounded-2xl border-2 border-transparent hover:border-sidebar-border transition-all">
                <Avatar className="h-11 w-11 rounded-xl ring-2 ring-background">
                  <AvatarImage src={user?.image || ''} />
                  <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-sidebar bg-green-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Profile & Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
