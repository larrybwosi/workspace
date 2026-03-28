"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Users } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function InvitePage() {
  const { code } = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data } = await apiClient.get(`/invite/${code}`)
        setInvite(data)
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load invitation")
      } finally {
        setLoading(false)
      }
    }

    if (code) {
      fetchInvite()
    }
  }, [code])

  const handleJoin = async () => {
    setJoining(true)
    try {
      const { data } = await apiClient.post(`/invite/${code}`, {})
      toast({ title: "Welcome!", description: `You have joined ${invite.workspace.name}` })
      router.push(`/workspace/${invite.workspace.slug}`)
    } catch (err: any) {
      toast({
        title: "Failed to join",
        description: err.response?.data?.error || "An error occurred",
        variant: "destructive"
      })
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive text-center">Invalid Invite</CardTitle>
            <CardDescription className="text-center">{error || "This invite link is invalid or has expired."}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>Go to Home</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
              <AvatarImage src={invite.workspace.icon} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {invite.workspace.name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">You've been invited!</CardTitle>
          <CardDescription>
            Join <span className="font-bold text-foreground">{invite.workspace.name}</span> on Dealio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 py-4 border-y">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">{invite.uses}</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Uses</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col items-center">
              <Users className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs text-muted-foreground uppercase font-semibold">Workspace</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full h-12 text-base font-semibold" onClick={handleJoin} disabled={joining}>
            {joining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : "Accept Invite"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/")}>
            No thanks
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
