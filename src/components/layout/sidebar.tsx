"use client";

import * as React from "react";
import {
  Plus,
  ChevronDown,
  Inbox,
  Bookmark,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/auth-client";
import { useNotifications } from "@/hooks/api/use-notifications";
import { useDMConversations } from "@/hooks/api/use-dm";
import { WorkspaceSwitcher } from "@/components/features/workspace/workspace-switcher";
import { UserProfileDialog } from "@/components/features/social/user-profile-dialog";
import { StartDMDialog } from "@/components/features/chat/start-dm-dialog";
import { User } from "@/lib/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeChannel: string;
  onChannelSelect: (channelId: string) => void;
  onMembersClick?: () => void;
  currentWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  activeChannel,
  onChannelSelect,
  currentWorkspaceId,
  onWorkspaceChange,
}: SidebarProps) {
  const { data: dmConversations = [], isLoading: dmsLoading } = useDMConversations()
  const { data: notificationsData } = useNotifications(true);

  const [favoritesOpen, setFavoritesOpen] = React.useState(true);
  const [directMessagesOpen, setDirectMessagesOpen] = React.useState(true);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [startDMOpen, setStartDMOpen] = React.useState(false)
  const session = useSession();
  const sessionUser = session.data?.user;

  const currentUser: User | undefined = sessionUser ? {
    id: sessionUser.id,
    name: sessionUser.name,
    avatar: sessionUser.image || "",
    role: "Admin", // Default role
    status: "online"
  } : undefined;

  const router = useRouter();

  const handleAssistantClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/assistant");
    onClose();
  };


  const renderLoadingSkeleton = (count: number = 3) => {
    return Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center h-8 px-2">
        <Skeleton className="h-4 w-4 mr-2" />
        <Skeleton className="h-3 flex-1" />
      </div>
    ));
  };

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
          <div className="p-2 space-y-1">
            {/* Quick Actions */}
            <Button
              variant={activeChannel === "assistant" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                activeChannel === "assistant" &&
                  "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              onClick={handleAssistantClick}
            >
              <Sparkles className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left text-sm">Assistant</span>
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 bg-blue-500/20 text-blue-400 border-0 shrink-0"
              >
                NEW
              </Badge>
            </Button>


            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Bookmark className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left text-sm">Drafts</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Bookmark className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left text-sm">Saved items</span>
            </Button>

            <Button
              variant={activeChannel === "notifications" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                activeChannel === "notifications" && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              onClick={() => router.push('/notifications')}
            >
              <Inbox className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left text-sm">Inbox</span>
              {(notificationsData?.notifications?.length > 0 || notificationsData?.total > 0) && (
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 shrink-0"
                >
                  {notificationsData?.total || notificationsData?.notifications?.length}
                </Badge>
              )}
            </Button>

            <Button
              variant={activeChannel === "friends" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                activeChannel === "friends" && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              onClick={() => router.push('/friends')}
            >
              <Users className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left text-sm">Friends</span>
            </Button>
          </div>


          {/* Direct messages */}
          <div className="px-2 py-2 mt-2">
            <div className="flex items-center justify-between mb-1">
              <Button
                variant="ghost"
                className="flex-1 justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setDirectMessagesOpen(!directMessagesOpen)}
              >
                <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", !directMessagesOpen && "-rotate-90")} />
                Direct messages
                <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-auto">
                  {dmConversations.length}
                </Badge>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStartDMOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {directMessagesOpen && (
              <div className="space-y-0.5">
                {dmsLoading ? (
                  renderLoadingSkeleton(3)
                ) : dmConversations.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-2">No conversations yet</div>
                ) : (
                  dmConversations.map((dm: any) => {
                    const otherUser = dm.members.find((m: any) => m.id !== dm.creatorId) || dm.members[0]
                    const dmId = `dm-${otherUser.id}`

                    return (
                      <Button
                        key={dm.id}
                        variant={activeChannel === dmId ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                          activeChannel === dmId && "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                        onClick={() => {
                          router.push(`/dm/${otherUser.id}`)
                          onClose()
                        }}
                      >
                        <div className="relative mr-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {otherUser.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "absolute bottom-0 right-0 h-2 w-2 border border-sidebar rounded-full",
                              otherUser.status === "online"
                                ? "bg-green-500"
                                : otherUser.status === "away"
                                  ? "bg-yellow-500"
                                  : "bg-gray-400",
                            )}
                          />
                        </div>
                        <span className="flex-1 text-left truncate text-sm">{otherUser.name}</span>
                        {dm._count?.messages > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {dm._count.messages}
                          </Badge>
                        )}
                      </Button>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Favorites Section */}
          <div className="mt-4">
            <div className="px-2 mb-1">
              <Button
                variant="ghost"
                className="w-full justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setFavoritesOpen(!favoritesOpen)}
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 mr-1 transition-transform shrink-0",
                    !favoritesOpen && "-rotate-90"
                  )}
                />
                Favorites
              </Button>
            </div>
            {favoritesOpen && (
              <div className="px-2 space-y-0.5">
                
              </div>
            )}
          </div>

        </ScrollArea>

        {/* User Profile Footer - Fixed */}
        <button
          className="h-14 border-t border-sidebar-border flex items-center gap-2 px-3 hover:bg-sidebar-accent transition-colors w-full text-left shrink-0"
          onClick={() => setProfileOpen(true)}
        >
          <div className="relative shrink-0">
            <Avatar className="h-8 w-8">
              <div className="text-xs bg-primary text-primary-foreground flex items-center justify-center h-full w-full">
                {currentUser?.avatar}
              </div>
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
              { "online"}
            </p>
          </div>
        </button>
      </aside>
        { currentUser &&
          <UserProfileDialog
            user={currentUser}
            open={profileOpen}
            onOpenChange={setProfileOpen}
          />
        }


      <StartDMDialog open={startDMOpen} onOpenChange={setStartDMOpen} />
    </>
  );
}
