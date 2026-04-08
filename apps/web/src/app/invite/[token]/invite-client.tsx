"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, UserPlus } from "lucide-react";
import { apiClient } from "@repo/api-client";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth/auth-client";

interface InviteClientProps {
    token: string;
    initialInviteData: any;
}

export default function InviteClient({ token, initialInviteData }: InviteClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { data: session, isPending: sessionLoading } = authClient.useSession();

    const [joining, setJoining] = useState(false);

    const handleAccept = async () => {
        if (!session) {
            router.push(`/signup?inviteToken=${token}`);
            return;
        }

        setJoining(true);
        try {
            await apiClient.post(`/invitations/${token}/accept`, {});
            toast({
                title: "Success!",
                description: initialInviteData.type === "platform_invitation"
                    ? "You've joined the platform!"
                    : `You've joined ${initialInviteData.invitation.workspace.name}`
            });

            if (initialInviteData.type !== "platform_invitation") {
                router.push(`/workspace/${initialInviteData.invitation.workspace.slug}`);
            } else {
                router.push("/");
            }
        } catch (err: any) {
            toast({
                title: "Failed to join",
                description: err.response?.data?.error || "An error occurred",
                variant: "destructive"
            });
        } finally {
            setJoining(false);
        }
    };

    const { invitation, type } = initialInviteData;
    const inviterName = invitation.inviter?.name || "A team member";

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
                            <AvatarImage src={type === "platform_invitation" ? invitation.inviter?.avatar : invitation.workspace?.icon} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                {type === "platform_invitation" ? (invitation.inviter?.name?.[0] || "?") : (invitation.workspace?.name?.[0] || "?")}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <CardTitle className="text-2xl">You've been invited!</CardTitle>
                    <CardDescription>
                        {type === "platform_invitation" ? (
                            <span><span className="font-bold text-foreground">{inviterName}</span> invited you to join Dealio</span>
                        ) : (
                            <span>Join <span className="font-bold text-foreground">{invitation.workspace?.name}</span> on Dealio</span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center gap-4 py-4 border-y">
                        {type === "workspace_link" && (
                            <>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold">{invitation.uses}</span>
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Uses</span>
                                </div>
                                <div className="w-px h-10 bg-border" />
                            </>
                        )}
                        <div className="flex flex-col items-center">
                            {type === "platform_invitation" ? (
                                <UserPlus className="h-6 w-6 text-primary mb-1" />
                            ) : (
                                <Users className="h-6 w-6 text-primary mb-1" />
                            )}
                            <span className="text-xs text-muted-foreground uppercase font-semibold">
                                {type === "platform_invitation" ? "Friend Invite" : "Workspace Invite"}
                            </span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        className="w-full h-12 text-base font-semibold"
                        onClick={handleAccept}
                        disabled={joining || sessionLoading}
                    >
                        {joining ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : "Accept Invite"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => router.push("/")}>
                        No thanks
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
