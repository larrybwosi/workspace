'use client';

import * as React from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Calendar,
  ArrowLeft,
  MessageSquare,
  MapPin,
  Phone,
  Edit2,
  LogOut,
  Shield,
  Crown,
  User as UserIcon,
  Menu
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  useUser,
  useUserSocialProfile,
  useCurrentUser
} from '@repo/api-client';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { cn } from '@repo/ui/lib/utils';

interface UserProfilePageProps {
  params: Promise<{ slug: string; userId: string }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { slug, userId } = use(params);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const { data: user, isLoading: isUserLoading } = useUser(userId);
  const { data: socialProfile, isLoading: isSocialLoading } = useUserSocialProfile(userId);
  const { data: currentUser } = useCurrentUser();

  const isCurrentUser = currentUser?.id === userId;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-xl">User not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentWorkspaceId={slug} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DynamicHeader
          activeView="User Profile"
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => {}}
        />
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            <Button
              variant="ghost"
              className="mb-6 gap-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Card className="overflow-hidden border-none shadow-lg">
              {/* Banner Section */}
              <div
                className="h-48 w-full bg-gradient-to-r from-primary/20 to-primary/40 relative"
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
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>

              <CardContent className="px-8 pb-8 relative">
                <div className="relative -mt-16 mb-6 inline-block">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={user?.avatar || user?.image || undefined} />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground font-bold">
                      {user?.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl font-bold">{user?.name}</h1>
                      {user?.role && (
                        <div className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          <Badge variant="secondary" className={cn(getRoleBadgeColor(user.role))}>
                            {user.role}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {user?.username && <p className="text-muted-foreground text-lg">@{user.username}</p>}

                    {(user?.statusText || user?.statusEmoji) && (
                      <div className="flex items-center gap-2 mt-2 text-foreground/80 bg-muted/30 p-2 rounded-md inline-flex">
                        {user.statusEmoji && <span>{user.statusEmoji}</span>}
                        {user.statusText && <span className="italic">{user.statusText}</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <div
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          user?.status === 'online' && 'bg-green-500',
                          user?.status === 'away' && 'bg-yellow-500',
                          user?.status === 'offline' && 'bg-gray-400'
                        )}
                      />
                      <span className="text-sm font-medium capitalize text-muted-foreground">{user?.status || 'offline'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isCurrentUser && (
                      <Button className="gap-2 px-6">
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                    )}
                    {isCurrentUser && (
                      <Button variant="outline" className="gap-2">
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                <Separator className="my-8" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">About</h4>
                      <p className="text-foreground leading-relaxed">
                        {user.bio || "No bio provided."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Joined {user.createdAt ? format(new Date(user.createdAt), 'PP') : 'May 2024'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {!isCurrentUser && (
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Mutual Connections</h4>
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">Mutual Workspaces</span>
                            <div className="flex flex-wrap gap-2">
                              {socialProfile?.mutualWorkspaces?.length > 0 ? (
                                socialProfile.mutualWorkspaces.map((ws: any) => (
                                  <Badge key={ws.id} variant="outline" className="gap-1">
                                    {ws.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No mutual workspaces</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">Mutual Friends</span>
                            <div className="flex flex-wrap gap-2">
                              {socialProfile?.mutualFriends?.length > 0 ? (
                                socialProfile.mutualFriends.map((friend: any) => (
                                  <Avatar key={friend.id} className="h-8 w-8 border border-background">
                                    <AvatarImage src={friend.avatar} alt={friend.name} />
                                    <AvatarFallback className="text-[10px]">
                                      {friend.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No mutual friends</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
