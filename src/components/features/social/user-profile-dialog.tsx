"use client";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  LogOut,
  MessageSquare,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { EditProfileModal } from "./edit-profile-modal";
import { useSession } from "@/lib/auth/auth-client";

interface UserProfileDialogProps {
  user: User & { banner?: string; statusText?: string; statusEmoji?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({
  user,
  open,
  onOpenChange,
}: UserProfileDialogProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { data: session } = useSession();
  const isCurrentUser = session?.user?.id === user.id;

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              View and manage user information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Banner Section */}
            <div
              className="h-24 w-full bg-primary/10 rounded-t-lg -mx-6 -mt-6 mb-8 relative"
              style={user?.banner ? { backgroundImage: `url(${user.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              <div className="absolute -bottom-10 left-6">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarImage src={user?.avatar || user?.image} />
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground font-bold">
                    {user?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Profile Header */}
            <div className="pt-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold">{user?.name}</h3>

                {/* Custom Status */}
                {(user?.statusText || user?.statusEmoji) && (
                   <div className="flex items-center gap-1.5 mt-1 text-sm text-foreground/80">
                      {user.statusEmoji && <span>{user.statusEmoji}</span>}
                      {user.statusText && <span className="italic">{user.statusText}</span>}
                   </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      user?.status === "online" && "bg-green-500",
                      user?.status === "away" && "bg-yellow-500",
                      user?.status === "offline" && "bg-gray-400"
                    )}
                  />
                  <span className="text-sm text-muted-foreground capitalize">
                    {user?.status}
                  </span>
                </div>
                <Badge className={cn("mt-3", getRoleBadgeColor(user?.role))}>
                  {user?.role}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {user?.name.toLowerCase().replace(" ", ".")}@conceptzilla.com
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined May 2024</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Activity Stats */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Activity</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">127</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-xs text-muted-foreground">Threads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-muted-foreground">Files</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 bg-transparent"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
              </div>
              {isCurrentUser && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                    onClick={() => setEditOpen(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent text-destructive hover:bg-destructive/10"
                    onClick={() => {
                       window.location.href = '/api/auth/sign-out';
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isCurrentUser && (
        <EditProfileModal
          user={user}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
