'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@repo/shared';
import { useOrganizationInvitationByToken, useAcceptOrganizationInvitation } from '@repo/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OrgInviteClient() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const { data: session, isPending: sessionLoading } = useSession();
  const { data: invitation, isLoading: inviteLoading, error } = useOrganizationInvitationByToken(token);
  const acceptMutation = useAcceptOrganizationInvitation();

  const handleAccept = async () => {
    if (!session) {
      router.push(`/login?callbackURL=/organization/invite/${token}`);
      return;
    }

    try {
      const res = await acceptMutation.mutateAsync(token);
      toast.success(`Successfully joined ${invitation?.organization?.name || 'the organization'}!`);
      router.push(`/organization/${invitation?.organization?.slug || ''}/settings`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to accept invitation.');
    }
  };

  if (sessionLoading || inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <Skeleton className="size-12 rounded-full mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive/20">
          <CardHeader className="text-center">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="size-6" />
            </div>
            <CardTitle>Invalid or Expired Invitation</CardTitle>
            <CardDescription>
              This organization invitation link is either invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={() => router.push('/')}>
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-3">
          <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Building2 className="size-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Join {invitation.organization.name}</CardTitle>
            <CardDescription className="mt-1">
              You have been invited to join <strong>{invitation.organization.name}</strong> as a {invitation.role || 'member'}.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {invitation.inviter && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <Avatar className="size-10">
                <AvatarImage src={invitation.inviter.avatar} />
                <AvatarFallback>{invitation.inviter.name?.[0]?.toUpperCase() || 'I'}</AvatarFallback>
              </Avatar>
              <div className="text-left text-sm">
                <p className="font-medium text-foreground">{invitation.inviter.name || invitation.inviter.email}</p>
                <p className="text-xs text-muted-foreground">Invited you to join</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {session ? (
            <Button className="w-full gap-2" size="lg" onClick={handleAccept} disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Accept Invitation
            </Button>
          ) : (
            <div className="w-full space-y-2">
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push(`/login?callbackURL=/organization/invite/${token}`)}
              >
                Sign In to Accept
              </Button>
              <Button
                className="w-full"
                variant="outline"
                size="lg"
                onClick={() => router.push(`/signup?callbackURL=/organization/invite/${token}`)}
              >
                Create Account to Accept
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
