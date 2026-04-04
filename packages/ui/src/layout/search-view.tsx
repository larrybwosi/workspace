"use client"

import * as React from "react"
import { Search, FileText, MessageSquare, Hash, X, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockSearchResults, mockRecentSearches } from "@/lib/mock-data"
import type { SearchResult } from "@/lib/types"

interface SearchViewProps {
  onClose: () => void
}

export function SearchView({ onClose }: SearchViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState("type")
  const [activeTab, setActiveTab] = React.useState("all")
  const [results, setResults] = React.useState<SearchResult[]>(mockSearchResults)

  const filterResults = (type?: string) => {
    if (!type || type === "all") {
      return results
    }
    return results.filter((r) => r.type === type)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "file":
        return <FileText className="h-4 w-4" />
      case "message":
        return <MessageSquare className="h-4 w-4" />
      case "thread":
        return <Hash className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 30) return `${diffDays} days ago`

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // In a real app, this would filter results based on the query
    if (query.trim()) {
      const filtered = mockSearchResults.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) || r.content.toLowerCase().includes(query.toLowerCase()),
      )
      setResults(filtered)
    } else {
      setResults(mockSearchResults)
    }
  }

  const allResults = filterResults("all")
  const threadResults = filterResults("thread")
  const fileResults = filterResults("file")
  const messageResults = filterResults("message")

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search in Dealio..."
              className="pl-9 pr-9"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => handleSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">
              All results
              <Badge variant="secondary" className="ml-2">
                {allResults.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="threads">
              Threads
              <Badge variant="secondary" className="ml-2">
                {threadResults.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="files">
              Files
              <Badge variant="secondary" className="ml-2">
                {fileResults.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="messages">
              Messages
              <Badge variant="secondary" className="ml-2">
                {messageResults.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Recent Searches */}
          {!searchQuery && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Recent searches</h3>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Clear
                </Button>
              </div>
              <div className="space-y-1">
                {mockRecentSearches.map((search, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    className="w-full justify-start text-sm h-9"
                    onClick={() => handleSearch(search)}
                  >
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Sort and Filter */}
          {searchQuery && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{results.length} results found</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="relevance">Relevance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Search Results */}
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="all" className="mt-0">
              <SearchResultsList results={allResults} />
            </TabsContent>
            <TabsContent value="threads" className="mt-0">
              <SearchResultsList results={threadResults} />
            </TabsContent>
            <TabsContent value="files" className="mt-0">
              <SearchResultsList results={fileResults} />
            </TabsContent>
            <TabsContent value="messages" className="mt-0">
              <SearchResultsList results={messageResults} />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}

function SearchResultsList({ results }: { results: SearchResult[] }) {
  const getResultIcon = (type: string) => {
    switch (type) {
      case "file":
        return <FileText className="h-4 w-4 text-muted-foreground" />
      case "message":
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />
      case "thread":
        return <Hash className="h-4 w-4 text-muted-foreground" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getAuthorAvatar = (authorName: string) => {
    return authorName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No results found</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((result) => (
        <button
          key={result.id}
          className="w-full p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">{getResultIcon(result.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{result.title}</h4>
                {result.type === "file" && (
                  <Badge variant="secondary" className="text-xs">
                    {result.title.split(".").pop()?.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{result.content}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                      {getAuthorAvatar(result.author)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{result.author}</span>
                </div>
                {result.channel && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {result.channel}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{formatDate(result.timestamp)}</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
