'use client';
import { Mail, Phone, MapPin, Calendar, Edit2, LogOut, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import type { User } from '../../lib/types';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { EditProfileModal } from './edit-profile-modal';
import { useSession } from '../../lib/auth/auth-client';

interface UserProfileDialogProps {
  user: User & { banner?: string; statusText?: string; statusEmoji?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ user, open, onOpenChange }: UserProfileDialogProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { data: session } = useSession();
  const isCurrentUser = session?.user?.id === user.id;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Design':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Management':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Development':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold">User Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-0">
            {/* Banner Section */}
            <div
              className="h-40 w-full bg-gradient-to-r from-primary/20 to-primary/40 relative"
              style={
                user?.banner
                  ? { backgroundImage: `url(${user.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : {}
              }
            >
              {user?.banner && (
                <img
                  src={user.banner}
                  alt="Profile Banner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="px-6 pb-6 relative">
              <div className="relative -mt-16 mb-4 inline-block">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={user?.avatar || user?.image || undefined} />
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground font-bold">
                    {user?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Header */}
              <div className="pt-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-bold">{user?.name}</h3>
                    {user?.username && <span className="text-muted-foreground text-lg">@{user.username}</span>}
                  </div>

                  {/* Custom Status */}
                  {(user?.statusText || user?.statusEmoji) && (
                    <div className="flex items-center gap-1.5 mt-1 text-base text-foreground/80">
                      {user.statusEmoji && <span>{user.statusEmoji}</span>}
                      {user.statusText && <span className="italic">{user.statusText}</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        user?.status === 'online' && 'bg-green-500',
                        user?.status === 'away' && 'bg-yellow-500',
                        user?.status === 'offline' && 'bg-gray-400'
                      )}
                    />
                    <span className="text-sm text-muted-foreground capitalize">{user?.status}</span>
                  </div>
                  <Badge className={cn('mt-3', getRoleBadgeColor(user?.role))}>{user?.role}</Badge>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Joined {user.createdAt ? format(new Date(user.createdAt), 'PP') : 'May 2024'}
                    </span>
                  </div>
                  {(user as any).phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{(user as any).phone}</span>
                    </div>
                  )}
                  {(user as any).location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{(user as any).location}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2 h-10">
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </Button>
                </div>
                {isCurrentUser && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 bg-muted/50 h-10 border-none hover:bg-muted"
                      onClick={() => setEditOpen(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 bg-muted/50 h-10 border-none text-destructive hover:bg-destructive/10"
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
          </div>
        </DialogContent>
      </Dialog>

      {isCurrentUser && <EditProfileModal user={user} open={editOpen} onOpenChange={setEditOpen} />}
    </>
  );
}
