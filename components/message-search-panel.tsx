"use client"

import * as React from "react"
import { Search, X, Calendar, User, Hash, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MessageSearchResult {
  id: string
  content: string
  userName: string
  userAvatar: string
  timestamp: Date
  channelName: string
  channelId: string
}

interface MessageSearchPanelProps {
  channelId?: string
  onMessageClick?: (messageId: string, channelId: string) => void
}

export function MessageSearchPanel({ channelId, onMessageClick }: MessageSearchPanelProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchFilter, setSearchFilter] = React.useState("all")
  const [results, setResults] = React.useState<MessageSearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

  const handleSearch = React.useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      // API call to search messages
      const response = await fetch(
        `/api/messages/search?query=${encodeURIComponent(searchQuery)}&filter=${searchFilter}${channelId ? `&channelId=${channelId}` : ""}`
      )
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error(" Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, searchFilter, channelId])

  React.useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchQuery, handleSearch])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, "gi")
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select value={searchFilter} onValueChange={setSearchFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All messages</SelectItem>
            <SelectItem value="mentions">Mentions</SelectItem>
            <SelectItem value="files">Has files</SelectItem>
            <SelectItem value="links">Has links</SelectItem>
            <SelectItem value="from-me">From me</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        {isSearching ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-muted-foreground">Searching...</div>
          </div>
        ) : results.length > 0 ? (
          <div className="p-2 space-y-1">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => onMessageClick?.(result.id, result.channelId)}
                className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {result.userName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{result.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(result.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-foreground/80 line-clamp-2">
                      {highlightMatch(result.content, searchQuery)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{result.channelName}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">No results found</p>
            <p className="text-xs text-muted-foreground mt-1">Try different keywords</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">Search messages</p>
            <p className="text-xs text-muted-foreground mt-1">Find messages, files, and more</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
