"use client";

import * as React from "react";
import {
  Search,
  UserPlus,
  MoreVertical,
  Crown,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { UserProfileDialog } from "../social/user-profile-dialog";
import { useWorkspaceMembers } from "@/hooks/api/use-workspaces";
import { useParams } from "next/navigation";
import { usePresence } from "@/lib/contexts/presence-context";

export function MembersPanel() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const params = useParams();
  const workspaceSlug = params.slug as string;
  const { data: members, isLoading } = useWorkspaceMembers(workspaceSlug);
  const { onlineUsers } = usePresence();

  const filteredMembers = (members || []).filter((m: any) =>
    m.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineMembers = filteredMembers.filter((m: any) => onlineUsers.has(m.user.id));
  const offlineMembers = filteredMembers.filter((m: any) => !onlineUsers.has(m.user.id));

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "admin":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "owner") {
      return <Crown className="h-3 w-3" />;
    }
    if (role === "admin") {
      return <Shield className="h-3 w-3" />;
    }
    return null;
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setProfileOpen(true);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading members...</div>;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Members</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {/* Members List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Online Members */}
            {onlineMembers.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-2 px-2">
                  Online — {onlineMembers.length}
                </h3>
                <div className="space-y-0.5">
                  {onlineMembers.map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 transition-colors cursor-pointer group"
                      onClick={() => handleUserClick(m.user as User)}
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.user.avatar || m.user.image} />
                          <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                            {m.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-background rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-medium truncate">
                            {m.user.name}
                          </p>
                          {getRoleIcon(m.role)}
                        </div>
                        <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Members */}
            {offlineMembers.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-2 px-2">
                  Offline — {offlineMembers.length}
                </h3>
                <div className="space-y-0.5">
                  {offlineMembers.map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 transition-colors cursor-pointer group opacity-60"
                      onClick={() => handleUserClick(m.user as User)}
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.user.avatar || m.user.image} />
                          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                            {m.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-medium truncate">
                            {m.user.name}
                          </p>
                          {getRoleIcon(m.role)}
                        </div>
                        <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* User Profile Dialog */}
      {selectedUser && (
        <UserProfileDialog
          user={selectedUser}
          open={profileOpen}
          onOpenChange={setProfileOpen}
        />
      )}
    </>
  );
}
