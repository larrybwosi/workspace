"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"

interface LinkPreviewData {
  title?: string | null
  description?: string | null
  image?: string | null
  siteName?: string | null
  url: string
}

export function LinkPreview({ url }: { url: string }) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        if (data.title || data.description || data.image) {
          setPreview(data)
        }
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPreview()
  }, [url])

  if (loading) return null // Or a small skeleton
  if (error || !preview) return null

  return (
    <div className="mt-2 max-w-lg border-l-4 border-muted bg-muted/20 rounded-r-lg overflow-hidden flex flex-col sm:flex-row">
      {preview.image && (
        <div className="shrink-0 w-full sm:w-32 h-32 bg-muted relative overflow-hidden">
          <img
            src={preview.image}
            alt={preview.title || "Preview"}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}
      <div className="p-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {preview.siteName && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {preview.siteName}
            </span>
          )}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-blue-500 hover:underline block truncate mb-1"
        >
          {preview.title || url}
        </a>
        {preview.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>
    </div>
  )
}
