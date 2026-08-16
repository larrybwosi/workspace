'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/dialog';
import { Button } from '../../components/button';
import { Label } from '../../components/label';
import { Input } from '../../components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/select';
import { useState, useEffect } from 'react';
import { Separator } from '../../components/separator';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '../../components/radio-group';
import { useUpdateChannel, useChannelMembers, useWorkspaceMembers, useAddChannelMembers, useRemoveChannelMember } from '@repo/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';
import { UserPlus, Trash2, Hash } from 'lucide-react';

interface EditChannelDialogProps {
  editChannelOpen: boolean;
  setEditChannelOpen: (open: boolean) => void;
  channelForm: { name: string; description: string; type: 'public' | 'private'; icon?: string };
  setChannelForm: (form: any) => void;
  handleEditChannel?: () => void;
  workspaceSlug?: string;
  channelId?: string;
}

export function EditChannelDialog({
  editChannelOpen,
  setEditChannelOpen,
  channelForm,
  setChannelForm,
  handleEditChannel,
  workspaceSlug,
  channelId,
}: EditChannelDialogProps) {
  const [preference, setPreference] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const updateChannelMutation = useUpdateChannel(workspaceSlug);

  useEffect(() => {
    if (editChannelOpen && channelId) {
      const fetchPreference = async () => {
        try {
          const res = await fetch(`/api/notifications/settings/channel?channelId=${channelId}`);
          if (res.ok) {
            const data = await res.json();
            setPreference(data.notificationPreference);
          }
        } catch (error) {
          console.error('Failed to fetch channel notification settings:', error);
        }
      };
      fetchPreference();
    }
  }, [editChannelOpen, channelId]);

  const { data: channelMembers = [] } = useChannelMembers(workspaceSlug, channelId);
  const { data: workspaceMembersData } = useWorkspaceMembers(workspaceSlug || '');
  const addMembersMutation = useAddChannelMembers(workspaceSlug, channelId);
  const removeMemberMutation = useRemoveChannelMember(workspaceSlug, channelId);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('');

  const workspaceMembersList = workspaceMembersData?.members || (Array.isArray(workspaceMembersData) ? workspaceMembersData : []);
  const channelMemberUserIds = new Set((channelMembers as any[]).map((m: any) => m.userId || m.user?.id));
  const availableWorkspaceMembers = workspaceMembersList.filter((m: any) => {
    const uId = m.userId || m.user?.id || m.id;
    return uId && !channelMemberUserIds.has(uId);
  });

  const handleAddMember = async () => {
    if (!selectedUserToAdd) return;
    try {
      await addMembersMutation.mutateAsync([selectedUserToAdd]);
      setSelectedUserToAdd('');
      toast.success('Member added to channel');
    } catch {
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    try {
      await removeMemberMutation.mutateAsync(targetUserId);
      toast.success('Member removed from channel');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const onSaveAll = async () => {
    setSaving(true);
    try {
      if (channelId) {
        await updateChannelMutation.mutateAsync({
          id: channelId,
          name: channelForm.name,
          description: channelForm.description,
          type: channelForm.type,
          icon: channelForm.icon || '#',
        } as any);

        await fetch('/api/notifications/settings/channel', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId, preference }),
        });
      }

      if (handleEditChannel) {
        handleEditChannel();
      }
      toast.success('Channel updated successfully');
      setEditChannelOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update channel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={editChannelOpen} onOpenChange={setEditChannelOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Channel</DialogTitle>
          <DialogDescription>Update channel settings.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Channel Name</Label>
            <Input value={channelForm.name} onChange={e => setChannelForm({ ...channelForm, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Channel Type</Label>
            <Select
              value={channelForm.type}
              onValueChange={(v: 'public' | 'private') => setChannelForm({ ...channelForm, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Channel Description</Label>
            <Input
              value={channelForm.description || ''}
              onChange={e => setChannelForm({ ...channelForm, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Channel Icon / Symbol</Label>
            <Input
              value={channelForm.icon || ''}
              onChange={e => setChannelForm({ ...channelForm, icon: e.target.value })}
              placeholder="# or icon identifier"
            />
          </div>

          {channelForm.type === 'private' && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label className="text-base font-semibold">Private Channel Members</Label>
                <div className="flex gap-2">
                  <Select value={selectedUserToAdd} onValueChange={setSelectedUserToAdd}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select workspace member to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWorkspaceMembers.map((m: any) => {
                        const memberUser = m.user || m;
                        const uId = memberUser.id || m.userId;
                        return (
                          <SelectItem key={uId} value={uId}>
                            {memberUser.name || memberUser.email}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddMember} disabled={!selectedUserToAdd || addMembersMutation.isPending} size="sm">
                    <UserPlus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                  {(channelMembers as any[]).map((cm: any) => {
                    const u = cm.user || cm;
                    const uId = u.id || cm.userId;
                    return (
                      <div key={uId} className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/50 text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback className="text-[10px]">{u.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name || u.email}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMember(uId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                  {(channelMembers as any[]).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">No members in channel yet</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator className="my-4" />

          <div className="space-y-4">
            <Label className="text-base">Notification Settings</Label>
            <RadioGroup
              value={preference || 'default'}
              onValueChange={v => setPreference(v === 'default' ? null : v)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="default" id="default" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="default" className="text-sm font-medium leading-none cursor-pointer">
                    Use Workspace Default
                  </Label>
                  <p className="text-xs text-muted-foreground">Follow the notification settings of the workspace.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="all" id="all-ch" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="all-ch" className="text-sm font-medium leading-none cursor-pointer">
                    All Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">Get notified for every message in this channel.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="mentions" id="mentions-ch" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="mentions-ch" className="text-sm font-medium leading-none cursor-pointer">
                    Only @mentions
                  </Label>
                  <p className="text-xs text-muted-foreground">Get notified only for mentions and @everyone/@here.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="nothing" id="nothing-ch" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="nothing-ch" className="text-sm font-medium leading-none cursor-pointer">
                    Nothing
                  </Label>
                  <p className="text-xs text-muted-foreground">Mute all notifications for this channel.</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditChannelOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSaveAll} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
