"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useInvitation, useAcceptInvitation } from "@/hooks/api/use-invitations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, CheckCircle2, XCircle, Mail, Lock, User } from "lucide-react"

export default function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter()
  const { data: invitation, isLoading, error } = useInvitation(token)
  const acceptInvitation = useAcceptInvitation(token)

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    // Validation
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = "Name is required"
    }
    if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      await acceptInvitation.mutateAsync({
        name: formData.name,
        password: formData.password,
      })

      // Redirect to login or dashboard
      router.push("/login?invited=true")
    } catch (error: any) {
      setFormErrors({
        submit: error.response?.data?.error || "Failed to accept invitation",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-blue-50 to-pink-50">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600" />
          <p className="mt-4 text-muted-foreground">Loading invitation...</p>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-blue-50 to-pink-50">
        <Card className="w-full max-w-md p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold mt-4">Invitation Not Found</h1>
          <p className="text-muted-foreground mt-2">This invitation link is invalid or has expired.</p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            Go to Homepage
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-3xl font-bold">You're Invited!</h1>
          <p className="text-muted-foreground mt-2">Create your account to get started</p>
        </div>

        {/* Invitation Details */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={invitation.inviter?.avatar || "/placeholder.svg"} />
              <AvatarFallback>{invitation.inviter?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{invitation.inviter?.name}</p>
              <p className="text-sm text-muted-foreground">Invited you</p>
            </div>
          </div>

          {invitation.project && (
            <div className="flex items-center gap-2 pt-3 border-t">
              <span className="text-2xl">{invitation.project.icon}</span>
              <div>
                <p className="font-medium text-sm">{invitation.project.name}</p>
                <p className="text-xs text-muted-foreground">{invitation.project.description}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{invitation.email}</span>
          </div>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="pl-10"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            {formErrors.password && <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
            {formErrors.confirmPassword && <p className="text-sm text-red-500 mt-1">{formErrors.confirmPassword}</p>}
          </div>

          {formErrors.submit && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">{formErrors.submit}</div>
          )}

          <Button type="submit" className="w-full" disabled={acceptInvitation.isPending}>
            {acceptInvitation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Accept Invitation & Create Account"
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </Card>
    </div>
  )
}
