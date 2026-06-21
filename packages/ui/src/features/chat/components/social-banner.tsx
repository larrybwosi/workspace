'use client';

import { memo } from 'react';
import { ShieldAlert, Check, UserPlus } from 'lucide-react';
import { Button } from '../../../components/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/avatar';
import { cn } from '../../../lib/utils';

export const SocialBannerStats = memo(({ socialProfile }: { socialProfile: any }) => {
  const hasMutualWorkspaces = socialProfile.mutualWorkspaces?.length > 0;
  const hasMutualFriends = socialProfile.mutualFriends?.length > 0;

  if (!hasMutualWorkspaces && !hasMutualFriends) {
    return <span className="text-[11px] font-medium text-muted-foreground">No mutual workspaces or friends</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5">
      {hasMutualWorkspaces && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {socialProfile.mutualWorkspaces.slice(0, 3).map((ws: any) => (
              <Avatar key={ws.id} className="h-5 w-5 rounded-md border-2 border-background shrink-0">
                <AvatarImage src={ws.icon} />
                <AvatarFallback className="text-[6px] rounded-md bg-muted">
                  {ws.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
            {socialProfile.mutualWorkspaces.length} mutual workspace
            {socialProfile.mutualWorkspaces.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {hasMutualFriends && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {socialProfile.mutualFriends.slice(0, 3).map((f: any) => (
              <Avatar key={f.id} className="h-5 w-5 border-2 border-background shrink-0">
                <AvatarImage src={f.avatar} />
                <AvatarFallback className="text-[6px] bg-muted">
                  {f.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
            {socialProfile.mutualFriends.length} mutual friend
            {socialProfile.mutualFriends.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
});

SocialBannerStats.displayName = 'SocialBannerStats';

export const SocialBannerActions = memo(({
  socialProfile,
  handleBlockUser,
  handleSendFriendRequest,
  isBlockPending,
  isFriendRequestPending
}: {
  socialProfile: any,
  handleBlockUser: () => void,
  handleSendFriendRequest: () => void,
  isBlockPending: boolean,
  isFriendRequestPending: boolean
}) => (
  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'h-9 px-4 text-xs font-bold rounded-xl flex-1 sm:flex-none border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20',
        socialProfile.isBlockedByMe && 'bg-destructive/10 text-destructive border-destructive/20'
      )}
      onClick={handleBlockUser}
      disabled={isBlockPending}
    >
      <ShieldAlert className="h-3.5 w-3.5 mr-2" />
      {socialProfile.isBlockedByMe ? 'Unblock' : 'Block'}
    </Button>
    <Button
      size="sm"
      className="h-9 px-4 text-xs font-bold rounded-xl flex-1 sm:flex-none shadow-sm"
      onClick={handleSendFriendRequest}
      disabled={
        isFriendRequestPending ||
        (socialProfile.friendRequestStatus === 'pending' && socialProfile.friendRequestSide === 'sender')
      }
    >
      {socialProfile.friendRequestStatus === 'pending' ? (
        socialProfile.friendRequestSide === 'sender' ? (
          <>
            <Check className="h-3.5 w-3.5 mr-2" />
            Request Sent
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5 mr-2" />
            Accept Request
          </>
        )
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5 mr-2" />
          Add Friend
        </>
      )}
    </Button>
  </div>
));

SocialBannerActions.displayName = 'SocialBannerActions';

export const SocialBanner = memo(({
  dmUser,
  socialProfile,
  handleBlockUser,
  handleSendFriendRequest,
  isBlockPending,
  isFriendRequestPending
}: {
  dmUser: any,
  socialProfile: any,
  handleBlockUser: () => void,
  handleSendFriendRequest: () => void,
  isBlockPending: boolean,
  isFriendRequestPending: boolean
}) => (
  <div className="bg-primary/5 border-b border-border/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <UserPlus className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-bold">{dmUser?.name || 'This user'} is not in your friend list</p>
        <SocialBannerStats socialProfile={socialProfile} />
      </div>
    </div>
    <SocialBannerActions
      socialProfile={socialProfile}
      handleBlockUser={handleBlockUser}
      handleSendFriendRequest={handleSendFriendRequest}
      isBlockPending={isBlockPending}
      isFriendRequestPending={isFriendRequestPending}
    />
  </div>
));

SocialBanner.displayName = 'SocialBanner';
