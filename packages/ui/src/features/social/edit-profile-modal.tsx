'use client';

import { useState } from 'react';
import { X, Upload, Smile, Loader2, Image as ImageIcon, Bell, AtSign, UserPlus, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/dialog';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Label } from '../../components/label';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';
import { Switch } from '../../components/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/tabs';
import { Separator } from '../../components/separator';
import { EmojiPicker } from '../../shared/emoji-picker';
import { useUpdateUser, useEligibleAssets } from '@repo/api-client';
import { toast } from 'sonner';
import { User } from '../../lib/types';
import { cn } from '../../lib/utils';

type NotificationLevel = 'all' | 'mentions' | 'none';

interface NotificationPreferences {
  channelMentions: NotificationLevel;
  channelMentionsSound: boolean;
  invites: NotificationLevel;
  invitesSound: boolean;
  directMessages: NotificationLevel;
  directMessagesSound: boolean;
}

interface EditProfileModalProps {
  user: User & { banner?: string; statusText?: string; statusEmoji?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ user, open, onOpenChange }: EditProfileModalProps) {
  const updateUser = useUpdateUser();
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username || '');
  const [avatar, setAvatar] = useState(user.avatar || user.image || '');
  const [banner, setBanner] = useState(user.banner || '');
  const [statusText, setStatusText] = useState(user.statusText || '');
  const [statusEmoji, setStatusEmoji] = useState(user.statusEmoji || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPreferences>((user as any).notificationPreferences || {
    channelMentions: 'mentions',
    channelMentionsSound: true,
    invites: 'all',
    invitesSound: true,
    directMessages: 'all',
    directMessagesSound: true,
  });

  const { data: assets } = useEligibleAssets();

  const avatars = (assets?.profileAssets || []).filter((a: any) => a.type === 'avatar');
  const banners = (assets?.profileAssets || []).filter((a: any) => a.type === 'banner');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser.mutateAsync({
        id: user.id,
        name,
        username,
        avatar,
        banner,
        statusText,
        statusEmoji,
        notificationPreferences: notifications,
      });
      toast.success('Profile updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large. Maximum size is 5 MB.`);
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
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updateNotification = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 shrink-0 w-auto self-start">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* ── PROFILE TAB ── */}
          <TabsContent value="profile" className="flex-1 overflow-y-auto mt-0">
            <div className="space-y-0">
              {/* Banner Preview */}
              <div
                className="h-40 w-full bg-gradient-to-r from-primary/20 to-primary/40 relative group cursor-pointer"
                style={
                  banner
                    ? {
                        backgroundImage: `url(${banner})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {}
                }
              >
                {banner && (
                  <img
                    src={banner}
                    alt="Profile Banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {uploadingBanner ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white text-sm font-medium">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading…
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">
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

              <div className="px-6 pb-6 relative">
                {/* Avatar Preview */}
                <div className="relative -mt-16 mb-4 inline-block">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={avatar || undefined} />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground font-bold">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <label
                    className={cn(
                      'absolute bottom-1 right-1',
                      uploadingAvatar ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground border-2 border-background shadow-lg flex items-center justify-center hover:bg-secondary/80 transition-colors">
                      <ImageIcon className="h-5 w-5" />
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

                {/* Asset Library */}
                {(avatars.length > 0 || banners.length > 0) && (
                  <div className="mb-6 space-y-4">
                    {avatars.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Admin-Approved Avatars
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {avatars.map((a: any) => (
                            <button
                              key={a.id}
                              disabled={!a.isEligible}
                              onClick={() => setAvatar(a.url)}
                              className={cn(
                                'h-10 w-10 rounded-full border-2 transition-all overflow-hidden relative',
                                avatar === a.url
                                  ? 'border-primary scale-110 shadow-md'
                                  : 'border-transparent hover:border-muted-foreground/30',
                                !a.isEligible && 'opacity-60 grayscale cursor-not-allowed'
                              )}
                            >
                              <img src={a.url} alt="asset" className="h-full w-full object-cover" />
                              {!a.isEligible && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <Lock className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {banners.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Admin-Approved Banners
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {banners.map((a: any) => (
                            <button
                              key={a.id}
                              disabled={!a.isEligible}
                              onClick={() => setBanner(a.url)}
                              className={cn(
                                'h-12 w-24 rounded border-2 transition-all overflow-hidden relative',
                                banner === a.url
                                  ? 'border-primary scale-105 shadow-md'
                                  : 'border-transparent hover:border-muted-foreground/30',
                                !a.isEligible && 'opacity-60 grayscale cursor-not-allowed'
                              )}
                            >
                              <img src={a.url} alt="asset" className="h-full w-full object-cover" />
                              {!a.isEligible && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <Lock className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Display Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your display name"
                      className="bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Username
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                        @
                      </span>
                      <Input
                        id="username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="username"
                        className="bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary pl-7"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Status */}
                <div className="space-y-2 mt-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Custom Status
                  </Label>
                  <div className="flex gap-2">
                    <EmojiPicker onEmojiSelect={setStatusEmoji}>
                      <Button variant="outline" className="px-3 shrink-0 bg-muted/50 border-none">
                        {statusEmoji || <Smile className="h-5 w-5 text-muted-foreground" />}
                      </Button>
                    </EmojiPicker>
                    <Input
                      value={statusText}
                      onChange={e => setStatusText(e.target.value)}
                      placeholder="What's on your mind?"
                      className="bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    {statusText && (
                      <Button variant="ghost" size="icon" onClick={() => setStatusText('')} className="shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── NOTIFICATIONS TAB ── */}
          <TabsContent value="notifications" className="flex-1 overflow-y-auto mt-0 px-6 py-4 space-y-1">
            <p className="text-xs text-muted-foreground mb-4">
              Control how and when you receive notifications for each activity type.
            </p>

            {/* Channel Mentions */}
            <NotificationRow
              icon={<AtSign className="h-4 w-4" />}
              label="Channel Mentions"
              description="When someone @mentions you in a channel"
              value={notifications.channelMentions}
              soundEnabled={notifications.channelMentionsSound}
              onValueChange={v => updateNotification('channelMentions', v)}
              onSoundChange={v => updateNotification('channelMentionsSound', v)}
            />

            <Separator className="my-1" />

            {/* Invites */}
            <NotificationRow
              icon={<UserPlus className="h-4 w-4" />}
              label="Invites"
              description="When someone invites you to a channel or workspace"
              value={notifications.invites}
              soundEnabled={notifications.invitesSound}
              onValueChange={v => updateNotification('invites', v)}
              onSoundChange={v => updateNotification('invitesSound', v)}
            />

            <Separator className="my-1" />

            {/* Direct Messages */}
            <NotificationRow
              icon={<MessageSquare className="h-4 w-4" />}
              label="Direct Messages"
              description="When you receive a new direct message"
              value={notifications.directMessages}
              soundEnabled={notifications.directMessagesSound}
              onValueChange={v => updateNotification('directMessages', v)}
              onSoundChange={v => updateNotification('directMessagesSound', v)}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="bg-muted/30 p-4 border-t shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || uploadingAvatar || uploadingBanner}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || uploadingAvatar || uploadingBanner} className="px-8">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────────

interface NotificationRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: NotificationLevel;
  soundEnabled: boolean;
  onValueChange: (value: NotificationLevel) => void;
  onSoundChange: (enabled: boolean) => void;
}

function NotificationRow({
  icon,
  label,
  description,
  value,
  soundEnabled,
  onValueChange,
  onSoundChange,
}: NotificationRowProps) {
  return (
    <div className="py-3 space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none mb-1">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-11">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="h-8 w-36 bg-muted/50 border-none text-xs focus:ring-1 focus:ring-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All messages</SelectItem>
            <SelectItem value="mentions">Mentions only</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <Label className="text-xs text-muted-foreground cursor-pointer select-none">Sound</Label>
          <Switch
            checked={soundEnabled}
            onCheckedChange={onSoundChange}
            disabled={value === 'none'}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>
    </div>
  );
}
