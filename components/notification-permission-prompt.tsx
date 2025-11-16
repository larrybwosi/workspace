"use client"

import { useState, useEffect } from "react"
import { Bell, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getFirebaseToken } from "@/lib/firebase-config"

export function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if we should show the prompt
    const checkPermission = async () => {
      if (!("Notification" in window)) return

      const permission = Notification.permission
      const hasAsked = localStorage.getItem("notification-permission-asked")

      if (permission === "default" && !hasAsked) {
        // Show prompt after a delay
        setTimeout(() => setShow(true), 3000)
      }
    }

    checkPermission()
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    try {
      const token = await getFirebaseToken()

      if (token) {
        // Register token with backend
        await fetch("/api/device-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            platform: "web",
            deviceInfo: {
              browser: navigator.userAgent,
              timestamp: new Date().toISOString(),
            },
          }),
        })

        localStorage.setItem("notification-permission-asked", "true")
        setShow(false)
      }
    } catch (error) {
      console.error("[v0] Failed to enable notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem("notification-permission-asked", "true")
    setShow(false)
  }

  if (!show) return null

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Enable Notifications</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated with real-time notifications for mentions, tasks, and project updates.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleEnable} disabled={loading}>
              {loading ? "Enabling..." : "Enable"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="size-6" onClick={handleDismiss}>
          <X className="size-4" />
        </Button>
      </div>
    </Card>
  )
}
