'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmojiPicker } from '@/components/shared/emoji-picker';
import { useCurrentUser, useUpdateUser, useUpdateUserStatus, useEligibleAssets } from '@repo/api-client';
import { useSession } from '@repo/shared';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import {
  User as UserIcon,
  Bell,
  Sliders,
  LogOut,
  Upload,
  Smile,
  Loader2,
  Image as ImageIcon,
  Lock,
  Sun,
  Moon,
  Laptop,
  CheckCircle,
  X,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

type NotificationLevel = 'all' | 'mentions' | 'none';

interface NotificationPreferences {
  channelMentions: NotificationLevel;
  channelMentionsSound: boolean;
  invites: NotificationLevel;
  invitesSound: boolean;
  directMessages: NotificationLevel;
  directMessagesSound: boolean;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch current user using TanStack query
  const { data: user, isLoading: userLoading, refetch } = useCurrentUser();
  const { data: assets } = useEligibleAssets();
  const updateUserMutation = useUpdateUser();
  const updateStatusMutation = useUpdateUserStatus();

  // Local state for profile form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [bio, setBio] = useState('');
  const [statusText, setStatusText] = useState('');
  const [statusEmoji, setStatusEmoji] = useState('');
  const [presence, setPresence] = useState<'online' | 'away' | 'busy' | 'offline'>('online');

  // Loading states for file uploads
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    channelMentions: 'mentions',
    channelMentionsSound: true,
    invites: 'all',
    invitesSound: true,
    directMessages: 'all',
    directMessagesSound: true,
  });

  // Populate local states when user data is fetched
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setAvatar(user.avatar || user.image || '');
      setBanner(user.banner || '');
      setBio(user.bio || '');
      setStatusText(user.statusText || '');
      setStatusEmoji(user.statusEmoji || '');
      setPresence((user.status as any) || 'online');

      if ((user as any).notificationPreferences) {
        setNotifications((user as any).notificationPreferences);
      }
    }
  }, [user]);

  // Handle saving profile changes
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        name,
        username,
        avatar,
        banner,
        bio,
        statusText,
        statusEmoji,
        ...({ notificationPreferences: notifications } as any),
      });
      toast({ title: 'Profile updated successfully' });
      refetch();
    } catch (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle changing user status/presence
  const handleStatusChange = async (newPresence: 'online' | 'away' | 'busy' | 'offline') => {
    setPresence(newPresence);
    try {
      await updateStatusMutation.mutateAsync({ status: newPresence });
      toast({ title: `Status set to ${newPresence}` });
    } catch (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: 'Maximum size allowed is 5 MB.', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingBanner;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      if (type === 'avatar') {
        setAvatar(data.url);
      } else {
        setBanner(data.url);
      }
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully` });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: `Failed to upload ${type}`, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updateNotification = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const avatars = (assets?.profileAssets || []).filter((a: any) => a.type === 'avatar');
  const banners = (assets?.profileAssets || []).filter((a: any) => a.type === 'banner');

  if (userLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChannel="settings"
        onChannelSelect={() => {}}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DynamicHeader activeView="Settings" onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => {}} />

        <div className="flex-1 overflow-y-auto bg-muted/10">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>
              <p className="text-muted-foreground">Customize your profile, app appearance, and notifications</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="bg-muted p-1 rounded-lg self-start">
                <TabsTrigger value="profile" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  My Profile
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2">
                  <Sliders className="h-4 w-4" />
                  App Preferences
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              {/* MY PROFILE TAB */}
              <TabsContent value="profile" className="space-y-6 mt-0">
                <Card className="overflow-hidden border-none shadow-md bg-card">
                  {/* Banner Editor Section */}
                  <div
                    className="h-48 w-full bg-gradient-to-r from-primary/20 to-primary/40 relative group cursor-pointer"
                    style={banner ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {banner && (
                      <img
                        src={banner}
                        alt="Profile Banner"
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {uploadingBanner ? (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white mr-2" />
                        <span className="text-white text-sm font-medium">Uploading Banner...</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer">
                          <div className="flex items-center gap-2 bg-background/90 text-foreground px-3 py-2 rounded-md text-sm font-semibold shadow hover:bg-background">
                            <Upload className="h-4 w-4" /> Change Banner
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={e => handleFileUpload(e, 'banner')}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 relative">
                    {/* Avatar Editor Section */}
                    <div className="relative -mt-20 mb-6 inline-block">
                      <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                        <AvatarImage src={avatar || undefined} />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
                          {name?.slice(0, 2).toUpperCase() || 'US'}
                        </AvatarFallback>
                      </Avatar>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      <label
                        className={cn(
                          'absolute bottom-0 right-0 cursor-pointer',
                          uploadingAvatar && 'pointer-events-none opacity-50'
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={uploadingAvatar}
                          onChange={e => handleFileUpload(e, 'avatar')}
                        />
                      </label>
                    </div>

                    {/* Approved Assets selection */}
                    {(avatars.length > 0 || banners.length > 0) && (
                      <div className="mb-6 space-y-4">
                        {avatars.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Admin-Approved Avatars</Label>
                            <div className="flex flex-wrap gap-2">
                              {avatars.map((a: any) => (
                                <button
                                  key={a.id}
                                  disabled={!a.isEligible}
                                  onClick={() => setAvatar(a.url)}
                                  className={cn(
                                    'h-10 w-10 rounded-full border-2 transition-all overflow-hidden relative',
                                    avatar === a.url
                                      ? 'border-primary scale-110 shadow'
                                      : 'border-transparent hover:border-muted-foreground/30',
                                    !a.isEligible && 'opacity-60 grayscale cursor-not-allowed'
                                  )}
                                >
                                  <img src={a.url} alt="asset" className="h-full w-full object-cover" />
                                  {!a.isEligible && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                      <Lock className="h-3.5 w-3.5 text-white" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {banners.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Admin-Approved Banners</Label>
                            <div className="flex flex-wrap gap-2">
                              {banners.map((a: any) => (
                                <button
                                  key={a.id}
                                  disabled={!a.isEligible}
                                  onClick={() => setBanner(a.url)}
                                  className={cn(
                                    'h-10 w-20 rounded border-2 transition-all overflow-hidden relative',
                                    banner === a.url
                                      ? 'border-primary scale-105 shadow'
                                      : 'border-transparent hover:border-muted-foreground/30',
                                    !a.isEligible && 'opacity-60 grayscale cursor-not-allowed'
                                  )}
                                >
                                  <img src={a.url} alt="asset" className="h-full w-full object-cover" />
                                  {!a.isEligible && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                      <Lock className="h-3.5 w-3.5 text-white" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Standard Profile Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Display Name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                            @
                          </span>
                          <Input
                            id="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="username"
                            className="pl-7"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2 mt-6">
                      <Label htmlFor="bio">About Me</Label>
                      <div className="relative">
                        <textarea
                          id="bio"
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          className="w-full bg-background border border-input rounded-md p-3 text-sm focus:ring-1 focus:ring-primary min-h-[100px] resize-none"
                          placeholder="Tell us about yourself..."
                          maxLength={190}
                        />
                        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground font-medium">
                          {bio.length}/190
                        </div>
                      </div>
                    </div>

                    {/* Custom Status */}
                    <div className="space-y-2 mt-6">
                      <Label>Custom Status</Label>
                      <div className="flex gap-2">
                        <EmojiPicker onEmojiSelect={setStatusEmoji}>
                          <Button variant="outline" className="px-3 shrink-0">
                            {statusEmoji || <Smile className="h-5 w-5 text-muted-foreground" />}
                          </Button>
                        </EmojiPicker>
                        <Input
                          value={statusText}
                          onChange={e => setStatusText(e.target.value)}
                          placeholder="What's on your mind?"
                        />
                        {statusText && (
                          <Button variant="ghost" size="icon" onClick={() => setStatusText('')} className="shrink-0">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={isSaving} className="px-6">
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* APP PREFERENCES TAB */}
              <TabsContent value="preferences" className="space-y-6 mt-0">
                <Card className="border-none shadow-md bg-card">
                  <CardHeader>
                    <CardTitle>App Preferences</CardTitle>
                    <CardDescription>Configure presence status and select a theme</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Presence Status */}
                    <div className="space-y-2">
                      <Label>Online Status</Label>
                      <Select value={presence} onValueChange={(val: any) => handleStatusChange(val)}>
                        <SelectTrigger className="w-full md:w-[240px]">
                          <SelectValue placeholder="Set status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                              Online
                            </span>
                          </SelectItem>
                          <SelectItem value="away">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                              Away
                            </span>
                          </SelectItem>
                          <SelectItem value="busy">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                              Do Not Disturb
                            </span>
                          </SelectItem>
                          <SelectItem value="offline">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                              Invisible
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Theme Selector */}
                    <div className="space-y-4">
                      <Label>Appearance Theme</Label>
                      <div className="grid grid-cols-3 gap-4 max-w-md">
                        <Button
                          variant={theme === 'light' ? 'default' : 'outline'}
                          className="h-20 flex flex-col items-center justify-center gap-2"
                          onClick={() => setTheme('light')}
                        >
                          <Sun className="h-5 w-5" />
                          <span className="text-xs">Light</span>
                        </Button>
                        <Button
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          className="h-20 flex flex-col items-center justify-center gap-2"
                          onClick={() => setTheme('dark')}
                        >
                          <Moon className="h-5 w-5" />
                          <span className="text-xs">Dark</span>
                        </Button>
                        <Button
                          variant={theme === 'system' ? 'default' : 'outline'}
                          className="h-20 flex flex-col items-center justify-center gap-2"
                          onClick={() => setTheme('system')}
                        >
                          <Laptop className="h-5 w-5" />
                          <span className="text-xs">System</span>
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Sign out */}
                    <div className="pt-2">
                      <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={() => {
                          window.location.href = '/api/auth/sign-out';
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* NOTIFICATION PREFERENCES TAB */}
              <TabsContent value="notifications" className="space-y-6 mt-0">
                <Card className="border-none shadow-md bg-card">
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive alerts and feedback sounds</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Channel Mentions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/20 border">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">Channel Mentions</p>
                        <p className="text-xs text-muted-foreground">When someone @mentions you in a workspace channel</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={notifications.channelMentions}
                          onValueChange={v => updateNotification('channelMentions', v as any)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All messages</SelectItem>
                            <SelectItem value="mentions">Mentions only</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground select-none">Sound</Label>
                          <Switch
                            checked={notifications.channelMentionsSound}
                            disabled={notifications.channelMentions === 'none'}
                            onCheckedChange={v => updateNotification('channelMentionsSound', v)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Invites */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/20 border">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">Invites</p>
                        <p className="text-xs text-muted-foreground">When you receive a workspace or channel invitation</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={notifications.invites}
                          onValueChange={v => updateNotification('invites', v as any)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="mentions">Mentions only</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground select-none">Sound</Label>
                          <Switch
                            checked={notifications.invitesSound}
                            disabled={notifications.invites === 'none'}
                            onCheckedChange={v => updateNotification('invitesSound', v)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Direct Messages */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/20 border">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">Direct Messages</p>
                        <p className="text-xs text-muted-foreground">When you receive a direct message</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={notifications.directMessages}
                          onValueChange={v => updateNotification('directMessages', v as any)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All messages</SelectItem>
                            <SelectItem value="mentions">Mentions only</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground select-none">Sound</Label>
                          <Switch
                            checked={notifications.directMessagesSound}
                            disabled={notifications.directMessages === 'none'}
                            onCheckedChange={v => updateNotification('directMessagesSound', v)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
