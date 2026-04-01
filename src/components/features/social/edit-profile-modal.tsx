"use client";

import { useState } from "react";
import { X, Upload, Smile, Loader2, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmojiPicker } from "@/components/shared/emoji-picker";
import { useUpdateUser } from "@/hooks/api/use-users";
import { toast } from "sonner";
import { User } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface EditProfileModalProps {
  user: User & { banner?: string; statusText?: string; statusEmoji?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({
  user,
  open,
  onOpenChange,
}: EditProfileModalProps) {
  const updateUser = useUpdateUser();
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || user.image || "");
  const [banner, setBanner] = useState(user.banner || "");
  const [statusText, setStatusText] = useState(user.statusText || "");
  const [statusEmoji, setStatusEmoji] = useState(user.statusEmoji || "");
  const [isSaving, setIsSaving] = useState(false);

  const { data: assets } = useQuery({
    queryKey: ['profile-assets'],
    queryFn: async () => {
      const { data } = await apiClient.get('/profile-assets');
      return data;
    }
  });

  const avatars = (assets || []).filter((a: any) => a.type === 'avatar');
  const banners = (assets || []).filter((a: any) => a.type === 'banner');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser.mutateAsync({
        id: user.id,
        name,
        avatar,
        banner,
        statusText,
        statusEmoji,
      });
      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-0">
          {/* Banner Preview */}
          <div
            className="h-32 w-full bg-gradient-to-r from-primary/20 to-primary/40 relative group cursor-pointer"
            style={banner ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Button variant="secondary" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" /> Change Banner
               </Button>
            </div>
          </div>

          <div className="px-6 pb-6 relative">
            {/* Avatar Preview */}
            <div className="relative -mt-12 mb-4 inline-block">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-2 border-background shadow-lg"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Asset Library (Simplified selector) */}
            {(avatars.length > 0 || banners.length > 0) && (
              <div className="mb-6 space-y-4">
                 {avatars.length > 0 && (
                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Admin-Approved Avatars</Label>
                      <div className="flex flex-wrap gap-2">
                         {avatars.map((a: any) => (
                           <button
                            key={a.id}
                            onClick={() => setAvatar(a.url)}
                            className={cn(
                              "h-10 w-10 rounded-full border-2 transition-all overflow-hidden",
                              avatar === a.url ? "border-primary scale-110 shadow-md" : "border-transparent hover:border-muted-foreground/30"
                            )}
                           >
                             <img src={a.url} alt="asset" className="h-full w-full object-cover" />
                           </button>
                         ))}
                      </div>
                   </div>
                 )}
                 {banners.length > 0 && (
                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Admin-Approved Banners</Label>
                      <div className="flex flex-wrap gap-2">
                         {banners.map((a: any) => (
                           <button
                            key={a.id}
                            onClick={() => setBanner(a.url)}
                            className={cn(
                              "h-12 w-24 rounded border-2 transition-all overflow-hidden",
                              banner === a.url ? "border-primary scale-105 shadow-md" : "border-transparent hover:border-muted-foreground/30"
                            )}
                           >
                             <img src={a.url} alt="asset" className="h-full w-full object-cover" />
                           </button>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
            )}

            <div className="space-y-4">
               {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* Custom Status */}
              <div className="space-y-2">
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
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="What's on your mind?"
                    className="bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  {statusText && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setStatusText("")}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Banner URL (Fallback for now until upload is ready) */}
              <div className="space-y-2">
                <Label htmlFor="banner" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Banner Image URL
                </Label>
                <Input
                  id="banner"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* Avatar URL (Fallback) */}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Avatar Image URL
                </Label>
                <Input
                  id="avatar"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-muted/30 p-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="px-8">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
