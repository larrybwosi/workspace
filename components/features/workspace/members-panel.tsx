"use client";

import * as React from "react";
import {
  Search,
  UserPlus,
  MoreVertical,
  Crown,
  Shield,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockUsers } from "@/lib/mock-data";
import type { User } from "@/lib/types";
import { InviteToWorkspaceDialog } from "./invite-to-workspace-dialog";
import { cn } from "@/lib/utils";
import { UserProfileDialog } from "../social/user-profile-dialog";

export function MembersPanel() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [userToInvite, setUserToInvite] = React.useState<User | null>(null);

  const filteredUsers = mockUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineUsers = filteredUsers.filter((u) => u.status === "online");
  const offlineUsers = filteredUsers.filter((u) => u.status === "offline");

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Design":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Management":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "Development":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "Admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "Admin") {
      return <Crown className="h-3 w-3" />;
    }
    if (role === "Management") {
      return <Shield className="h-3 w-3" />;
    }
    return null;
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setProfileOpen(true);
  };

  const handleInviteToWorkspace = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserToInvite(user);
    setInviteDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Team Members</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Members List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Online Members */}
            {onlineUsers.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Online — {onlineUsers.length}
                </h3>
                <div className="space-y-1">
                  {onlineUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                      onClick={() => handleUserClick(user)}
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          {getRoleIcon(user.role)}
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs h-5",
                            getRoleBadgeColor(user.role)
                          )}
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleUserClick(user)}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleInviteToWorkspace(user, e)}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            Invite to Workspace
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Members */}
            {offlineUsers.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Offline — {offlineUsers.length}
                </h3>
                <div className="space-y-1">
                  {offlineUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group opacity-60"
                      onClick={() => handleUserClick(user)}
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-gray-400 border-2 border-background rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          {getRoleIcon(user.role)}
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs h-5",
                            getRoleBadgeColor(user.role)
                          )}
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleUserClick(user)}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Workspace Invitation Dialog */}
      {userToInvite && (
        <InviteToWorkspaceDialog
          userId={userToInvite.id}
          userName={userToInvite.name}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      )}
    </>
  );
}
