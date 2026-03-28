"use client";

import * as React from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  Sparkles,
  BarChart3,
  Plug2,
  CreditCard,
  ShieldCheck,
  FolderKanban,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth/auth-client";
import { WorkspaceSwitcher } from "@/components/features/workspace/workspace-switcher";
import { UserProfileDialog } from "@/components/features/social/user-profile-dialog";
import { CreateChannelDialog } from "@/components/features/chat/create-channel-dialog";
import { useCreateWorkspaceChannel, useWorkspaceChannels } from "@/hooks/api/use-workspaces";
import { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
}

export function WorkspaceSidebar({
  isOpen,
  onClose,
  currentWorkspaceId,
  onWorkspaceChange,
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const { slug } = useParams();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false);
  const createChannelMutation = useCreateWorkspaceChannel(currentWorkspaceId || "");
  const { data: channels, isLoading: channelsLoading } = useWorkspaceChannels(currentWorkspaceId || "");

  const session = useSession();
  const sessionUser = session.data?.user;

  const currentUser: User | undefined = sessionUser ? {
    id: sessionUser.id,
    name: sessionUser.name,
    avatar: sessionUser.image || "",
    role: "Admin",
    status: "online"
  } : undefined;

  const handleCreateChannel = (channelData: {
    name: string;
    description: string;
    isPrivate: boolean;
  }) => {
    createChannelMutation.mutate({
      name: channelData.name,
      description: channelData.description,
      type: channelData.isPrivate ? "private" : "public",
    }, {
        onSuccess: () => {
            setCreateChannelOpen(false);
        }
    });
  };

  const menuItems = [
    {
      label: "General",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: `/workspace/${slug}` },
        { icon: Sparkles, label: "Assistant", href: "/assistant" },
      ]
    },
    {
      label: "Quick Actions",
      items: [
        { icon: Plus, label: "Create Channel", onClick: () => setCreateChannelOpen(true) },
        { icon: UserPlus, label: "Invite Members", href: `/workspace/${slug}/members` },
      ]
    },
    {
      label: "Workspace",
      items: [
        { icon: Users, label: "Members", href: `/workspace/${slug}/members` },
        { icon: FolderKanban, label: "Projects", href: `/workspace/${slug}/projects` },
      ]
    },
    {
      label: "Administration",
      items: [
        { icon: BarChart3, label: "Analytics", href: `/workspace/${slug}/analytics` },
        { icon: Plug2, label: "Integrations", href: `/workspace/${slug}/integrations` },
        { icon: Settings, label: "Settings", href: `/workspace/${slug}/settings` },
      ]
    },
    {
      label: "Enterprise",
      items: [
        { icon: CreditCard, label: "Billing", href: `/workspace/${slug}/billing` },
        { icon: ShieldCheck, label: "Audit Logs", href: `/workspace/${slug}/audit-logs` },
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Workspace Switcher */}
        <div className="border-b border-sidebar-border p-2 shrink-0">
          <WorkspaceSwitcher
            currentWorkspaceId={currentWorkspaceId}
            onWorkspaceChange={onWorkspaceChange}
          />
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-6">
            {menuItems.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </h4>
                <div className="space-y-0.5">
                  {section.items.map((item, itemIdx) => (
                    <Button
                      key={itemIdx}
                      variant="ghost"
                      className="w-full justify-start h-9 px-2 text-sidebar-foreground hover:bg-sidebar-accent group"
                      onClick={() => {
                        if (item.onClick) {
                            item.onClick();
                        } else if (item.href) {
                            router.push(item.href);
                            onClose();
                        }
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-2.5 shrink-0 text-muted-foreground group-hover:text-sidebar-accent-foreground" />
                      <span className="flex-1 text-left text-sm font-medium">
                        {item.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {/* Channels Section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Channels
                </h4>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setCreateChannelOpen(true)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-0.5">
                {channelsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center h-9 px-2">
                      <Skeleton className="h-4 w-4 mr-2.5" />
                      <Skeleton className="h-3 flex-1" />
                    </div>
                  ))
                ) : channels?.length > 0 ? (
                  channels.map((channel: any) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      className="w-full justify-start h-9 px-2 text-sidebar-foreground hover:bg-sidebar-accent group"
                      onClick={() => {
                        router.push(`/workspace/${slug}/channels/${channel.id}`);
                        onClose();
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2.5 shrink-0 text-muted-foreground group-hover:text-sidebar-accent-foreground" />
                      <span className="flex-1 text-left text-sm font-medium truncate">
                        {channel.name}
                      </span>
                    </Button>
                  ))
                ) : (
                  <div className="px-2 py-2 text-xs text-muted-foreground italic text-center">
                    No channels yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* User Profile Footer */}
        <button
          className="h-14 border-t border-sidebar-border flex items-center gap-2 px-3 hover:bg-sidebar-accent transition-colors w-full text-left shrink-0"
          onClick={() => setProfileOpen(true)}
        >
          <div className="relative shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {currentUser?.name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-sidebar rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {currentUser?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              online
            </p>
          </div>
        </button>
      </aside>

      {currentUser && (
        <UserProfileDialog
          user={currentUser}
          open={profileOpen}
          onOpenChange={setProfileOpen}
        />
      )}

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        onCreateChannel={handleCreateChannel}
      />
    </>
  );
}
