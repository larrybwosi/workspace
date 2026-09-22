'use client';

import { useState } from 'react';
import {
  useOrganizationMembers,
  useOrganizationInvitations,
  useInviteOrganizationMember,
  useRevokeOrganizationInvitation,
} from '@repo/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Mail, Trash2, Loader2, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface MembersTabProps {
  orgSlug: string;
}

export function MembersTab({ orgSlug }: MembersTabProps) {
  const { data: members, isLoading: membersLoading } = useOrganizationMembers(orgSlug);
  const { data: invitations, isLoading: invitationsLoading } = useOrganizationInvitations(orgSlug);

  const inviteMember = useInviteOrganizationMember(orgSlug);
  const revokeInvitation = useRevokeOrganizationInvitation(orgSlug);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await inviteMember.mutateAsync({ email: email.trim(), role });
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      setRole('member');
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send invitation.');
    }
  };

  const handleRevoke = async (invitationId: string, email: string) => {
    try {
      await revokeInvitation.mutateAsync(invitationId);
      toast.success(`Invitation for ${email} revoked.`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to revoke invitation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Organization Members</h2>
          <p className="text-sm text-muted-foreground">Manage users and pending invitations for this organization.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="size-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleInvite}>
              <DialogHeader>
                <DialogTitle>Invite Organization Member</DialogTitle>
                <DialogDescription>
                  Send an email invitation button to join this organization.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMember.isPending}>
                  {inviteMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Active Members ({members?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !members || members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No members found.</p>
          ) : (
            <div className="divide-y">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage src={member.user.avatar} />
                      <AvatarFallback>{member.user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <Badge variant={member.role === 'owner' || member.role === 'admin' ? 'default' : 'secondary'}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            Pending Invitations ({invitations?.length || 0})
          </CardTitle>
          <CardDescription>Invitations sent that have not been accepted yet.</CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !invitations || invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pending invitations.</p>
          ) : (
            <div className="divide-y">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Role: {invitation.role} • Invited by {invitation.inviter?.name || 'Admin'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRevoke(invitation.id, invitation.email)}
                    disabled={revokeInvitation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
