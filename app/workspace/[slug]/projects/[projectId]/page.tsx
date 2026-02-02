"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function WorkspaceProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  // Redirect to the main project page which has full functionality
  useEffect(() => {
    router.push(`/projects/${projectId}`)
  }, [projectId, router])

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">Redirecting to project...</p>
    </div>
  )
}
