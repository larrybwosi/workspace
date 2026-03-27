"use client"

import { useEffect, useState } from "react"
import { Phone, Video, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface CallNotificationProps {
  callId: string
  initiatorName: string
  initiatorAvatar: string
  type: "voice" | "video"
  onAccept: () => void
  onDecline: () => void
}

export function CallNotification({ 
  callId, 
  initiatorName, 
  initiatorAvatar, 
  type,
  onAccept,
  onDecline 
}: CallNotificationProps) {
  const [isRinging, setIsRinging] = useState(true)

  useEffect(() => {
    // Auto-decline after 30 seconds
    const timeout = setTimeout(() => {
      onDecline()
    }, 30000)

    return () => clearTimeout(timeout)
  }, [onDecline])

  return (
    <AnimatePresence>
      {isRinging && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <Card className="p-4 w-80 shadow-lg border-2 border-primary">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 animate-pulse">
                <img src={initiatorAvatar || "/placeholder.svg"} alt={initiatorName} />
                <AvatarFallback>{initiatorName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{initiatorName}</p>
                <p className="text-sm text-muted-foreground">
                  Incoming {type} call...
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onDecline}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={onDecline}
              >
                Decline
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={onAccept}
              >
                {type === "video" ? (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Accept
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Accept
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
