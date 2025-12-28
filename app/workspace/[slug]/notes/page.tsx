"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { FileText, Plus, Search, FolderOpen, Star, Clock, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface NotesPageProps {
  params: Promise<{ slug: string }>
}

export default function NotesPage({ params }: NotesPageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")

  // Mock notes data - replace with API call
  const notes = [
    {
      id: "1",
      title: "Q1 Planning Notes",
      preview: "Key objectives and strategies for the first quarter...",
      folder: "Planning",
      isFavorite: true,
      lastModified: "2024-03-10T10:00:00Z",
      author: "John Doe",
    },
    {
      id: "2",
      title: "Engineering Roadmap",
      preview: "Technical priorities and infrastructure improvements...",
      folder: "Engineering",
      isFavorite: false,
      lastModified: "2024-03-09T15:30:00Z",
      author: "Jane Smith",
    },
  ]

  const filteredNotes = notes.filter((note) => note.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notes</h1>
            <p className="text-muted-foreground">Workspace shared notes and documentation</p>
          </div>
          <Button onClick={() => router.push(`/workspace/${slug}/notes/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="p-6">
        {filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-4">Create your first note to get started</p>
              <Button onClick={() => router.push(`/workspace/${slug}/notes/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{note.title}</h3>
                            {note.isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{note.preview}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              {note.isFavorite ? "Unfavorite" : "Favorite"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {note.folder}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(note.lastModified).toLocaleDateString()}
                        </span>
                        <span>by {note.author}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
