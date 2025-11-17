"use client"

import * as React from "react"
import { X, Menu } from "lucide-react"
import {
  Search,
  Plus,
  Trash2,
  Star,
  Clock,
  Folder,
  ChevronRight,
  LinkIcon,
  FileText,
  Edit2,
  Copy,
  FolderPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { NoteEditor } from "./note-editor"
import type { Note } from "@/lib/types"
import { mockNotes } from "@/lib/mock-data"

export function NotesView() {
  const [notes, setNotes] = React.useState<Note[]>(mockNotes)
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedFolders, setExpandedFolders] = React.useState<string[]>(["folder-1", "folder-2"])
  const [viewMode, setViewMode] = React.useState<"recent" | "favorites" | "folders">("folders")
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [renamingFolder, setRenamingFolder] = React.useState<string | null>(null)
  const [newFolderName, setNewFolderName] = React.useState("")

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => (prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]))
  }

  const createNewNote = (folderId?: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "Untitled",
      content: "",
      folderId: folderId || "folder-1",
      tags: [],
      createdBy: "user-1",
      createdAt: new Date(),
      lastModified: new Date(),
      isFavorite: false,
      linkedProjects: [],
      collaborators: ["user-1"],
    }
    setNotes([newNote, ...notes])
    setSelectedNote(newNote)
    setViewMode("recent")
  }

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter((n) => n.id !== noteId))
    if (selectedNote?.id === noteId) {
      setSelectedNote(null)
    }
  }

  const duplicateNote = (note: Note) => {
    const duplicatedNote: Note = {
      ...note,
      id: `note-${Date.now()}`,
      title: `${note.title} (Copy)`,
      createdAt: new Date(),
      lastModified: new Date(),
    }
    setNotes([duplicatedNote, ...notes])
    setSelectedNote(duplicatedNote)
  }

  const toggleFavorite = (noteId: string) => {
    setNotes(notes.map((n) => (n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n)))
  }

  const moveNoteToFolder = (noteId: string, folderId: string) => {
    setNotes(notes.map((n) => (n.id === noteId ? { ...n, folderId } : n)))
  }

  const renameFolder = () => {
    if (renamingFolder && newFolderName.trim()) {
      // In a real app, you'd update the folder name in the backend
      console.log(" Renaming folder", renamingFolder, "to", newFolderName)
      setRenameDialogOpen(false)
      setRenamingFolder(null)
      setNewFolderName("")
    }
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Group notes by folder
  const notesByFolder = React.useMemo(() => {
    const folders: Record<string, Note[]> = {}
    filteredNotes.forEach((note) => {
      if (!folders[note.folderId]) {
        folders[note.folderId] = []
      }
      folders[note.folderId].push(note)
    })
    return folders
  }, [filteredNotes])

  const getFolderName = (folderId: string) => {
    const folderMap: Record<string, string> = {
      "folder-1": "Equal. Product Design Agency",
      "folder-2": "UX audit & Nav Architecture",
      "folder-3": "Dribbble shots",
      "folder-4": "Personal stuff",
    }
    return folderMap[folderId] || "Uncategorized"
  }

  const getFolderIcon = (folderId: string) => {
    const iconMap: Record<string, string> = {
      "folder-1": "💚",
      "folder-2": "📂",
      "folder-3": "🎨",
      "folder-4": "😊",
    }
    return iconMap[folderId] || "📁"
  }

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  const updateNote = React.useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes((prevNotes) => prevNotes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)))
    // Update selected note if it's the one being updated
    setSelectedNote((prev) => (prev?.id === noteId ? { ...prev, ...updates } : prev))
  }, [])

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar - Notes List */}
      <div
        className={cn(
          "border-r border-border flex flex-col transition-all duration-300",
          "fixed md:relative inset-y-0 left-0 z-50 md:z-0",
          "bg-background md:bg-transparent",
          sidebarCollapsed ? "w-16" : "w-80",
          !mobileSidebarOpen && "hidden md:flex",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hidden md:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", !sidebarCollapsed && "rotate-180")} />
            </Button>

            {/* Title and New Note Button */}
            {!sidebarCollapsed && (
              <>
                <h2 className="text-lg font-semibold">Notes</h2>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => createNewNote()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Search and Quick Actions */}
          {!sidebarCollapsed && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘S
                </kbd>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "recent" ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setViewMode("recent")}
                >
                  <Clock className="h-3 w-3" />
                  Recent
                  <kbd className="ml-auto text-[10px] text-muted-foreground">⌘R</kbd>
                </Button>
                <Button
                  variant={viewMode === "favorites" ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setViewMode("favorites")}
                >
                  <Star className="h-3 w-3" />
                  Favorites
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Drafts and Deleted */}
        {!sidebarCollapsed && (
          <>
            <div className="px-3 py-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start h-9 px-3 gap-2">
                <FileText className="h-4 w-4" />
                Drafts
                <Badge variant="secondary" className="ml-auto text-xs">
                  3
                </Badge>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-9 px-3 gap-2">
                <Trash2 className="h-4 w-4" />
                Deleted
                <Badge variant="secondary" className="ml-auto text-xs">
                  12
                </Badge>
              </Button>
            </div>

            {/* Notes List */}
            <ScrollArea className="flex-1">
              {viewMode === "recent" && (
                <div className="p-3 space-y-1">
                  {filteredNotes
                    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
                    .map((note) => (
                      <ContextMenu key={note.id}>
                        <ContextMenuTrigger>
                          <button
                            onClick={() => setSelectedNote(note)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors space-y-2",
                              selectedNote?.id === note.id && "bg-muted",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-sm line-clamp-1">{note.title}</h3>
                              {note.isFavorite && (
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {note.content.substring(0, 100)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {note.lastModified.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                              {note.linkedProjects.length > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <LinkIcon className="h-3 w-3" />
                                    <span>{note.linkedProjects.length}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            {note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {note.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => setSelectedNote(note)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Open
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => toggleFavorite(note.id)}>
                            <Star className="mr-2 h-4 w-4" />
                            {note.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => duplicateNote(note)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => deleteNote(note.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                </div>
              )}

              {viewMode === "favorites" && (
                <div className="p-3 space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 px-3">Favorites</div>
                  {filteredNotes
                    .filter((note) => note.isFavorite)
                    .map((note) => (
                      <ContextMenu key={note.id}>
                        <ContextMenuTrigger>
                          <button
                            onClick={() => setSelectedNote(note)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors",
                              selectedNote?.id === note.id && "bg-muted",
                            )}
                          >
                            <h3 className="font-medium text-sm mb-1">{note.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {note.content.substring(0, 100)}
                            </p>
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => setSelectedNote(note)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Open
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => toggleFavorite(note.id)}>
                            <Star className="mr-2 h-4 w-4" />
                            Remove from Favorites
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => duplicateNote(note)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => deleteNote(note.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                </div>
              )}

              {viewMode === "folders" && (
                <div className="p-3 space-y-2">
                  {Object.entries(notesByFolder).map(([folderId, folderNotes]) => {
                    const isExpanded = expandedFolders.includes(folderId)
                    return (
                      <div key={folderId}>
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-8 px-2"
                              onClick={() => toggleFolder(folderId)}
                            >
                              <ChevronRight
                                className={cn("h-4 w-4 mr-1 transition-transform", isExpanded && "rotate-90")}
                              />
                              <span className="mr-2">{getFolderIcon(folderId)}</span>
                              <span className="flex-1 text-left text-sm">{getFolderName(folderId)}</span>
                              <Badge variant="secondary" className="text-xs">
                                {folderNotes.length}
                              </Badge>
                            </Button>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => createNewNote(folderId)}>
                              <Plus className="mr-2 h-4 w-4" />
                              New Note
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => toggleFolder(folderId)}>
                              <FolderPlus className="mr-2 h-4 w-4" />
                              New Subfolder
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={() => {
                                setRenamingFolder(folderId)
                                setNewFolderName(getFolderName(folderId))
                                setRenameDialogOpen(true)
                              }}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Rename
                            </ContextMenuItem>
                            <ContextMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Folder
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                        {isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {folderNotes.map((note) => (
                              <ContextMenu key={note.id}>
                                <ContextMenuTrigger>
                                  <button
                                    onClick={() => setSelectedNote(note)}
                                    className={cn(
                                      "w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm",
                                      selectedNote?.id === note.id && "bg-muted",
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="line-clamp-1">{note.title}</span>
                                      {note.isFavorite && (
                                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0 ml-2" />
                                      )}
                                    </div>
                                  </button>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem onClick={() => setSelectedNote(note)}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Open
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={() => toggleFavorite(note.id)}>
                                    <Star className="mr-2 h-4 w-4" />
                                    {note.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={() => duplicateNote(note)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </ContextMenuItem>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem onClick={() => deleteNote(note.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer - View Toggle */}
            <div className="p-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">My Folders</div>
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 gap-2"
                onClick={() => setViewMode("folders")}
              >
                <Folder className="h-4 w-4" />
                <span className="flex-1 text-left text-sm">Browse by folder</span>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Main Content - Note Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedNote && (
          <div className="md:hidden border-b border-border p-3 flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMobileSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <h3 className="text-sm font-medium truncate">{selectedNote.title}</h3>
          </div>
        )}

        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onClose={() => setSelectedNote(null)}
            onUpdate={updateNote}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-sm">
              <Button
                size="icon"
                variant="outline"
                className="md:hidden mx-auto mb-4 bg-transparent"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>

              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">No note selected</h3>
                <p className="text-sm text-muted-foreground">Select a note from the sidebar or create a new one</p>
              </div>
              <Button className="gap-2" onClick={() => createNewNote()}>
                <Plus className="h-4 w-4" />
                New Note
                <kbd className="ml-2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘N
                </kbd>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Enter a new name for this folder.</DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                renameFolder()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={renameFolder}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
