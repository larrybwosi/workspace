"use client"

import { useMemo, ReactNode } from "react"
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react"

export function AgoraClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    if (typeof window === 'undefined') return null
    return AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
  }, [])

  if (!client) return <>{children}</>

  return (
    <AgoraRTCProvider client={client}>
      {children}
    </AgoraRTCProvider>
  )
}
