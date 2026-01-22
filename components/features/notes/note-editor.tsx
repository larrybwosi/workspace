"use client";

import * as React from "react";
import {
  Star,
  MoreHorizontal,
  Share,
  LinkIcon,
  Clock,
  X,
  Plus,
  Tag,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Note } from "@/lib/types";
import { mockUsers, mockProjects } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

interface NoteEditorProps {
  note: Note;
  onClose: () => void;
  onUpdate?: (noteId: string, updates: Partial<Note>) => void;
}

export function NoteEditor({ note, onClose, onUpdate }: NoteEditorProps) {
  const [title, setTitle] = React.useState(note.title);
  const [content, setContent] = React.useState(note.content);
  const [tags, setTags] = React.useState<string[]>(note.tags);
  const [isFavorite, setIsFavorite] = React.useState(note.isFavorite);
  const [linkProjectOpen, setLinkProjectOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [linkedProjects, setLinkedProjects] = React.useState<string[]>(
    note.linkedProjects
  );
  const [collaborators, setCollaborators] = React.useState<string[]>(
    note.collaborators || []
  );

  const [tagInputOpen, setTagInputOpen] = React.useState(false);
  const [newTag, setNewTag] = React.useState("");

  const [focusedLineIndex, setFocusedLineIndex] = React.useState<number | null>(
    null
  );
  const [editingContent, setEditingContent] = React.useState("");
  const [lines, setLines] = React.useState<string[]>([]);
  const [showCommandMenu, setShowCommandMenu] = React.useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = React.useState({
    top: 0,
    left: 0,
  });
  const editorRef = React.useRef<HTMLDivElement>(null);
  const contentEditableRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const creator =
    mockUsers.find((u) => u.id === note.createdBy) || mockUsers[0];

  React.useEffect(() => {
    setLines(content.split("\n"));
  }, [content]);

  const debouncedSave = React.useCallback(
    (updates: Partial<Note>) => {
      if (onUpdate) {
        onUpdate(note.id, updates);
      }
    },
    [note.id, onUpdate]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (
        title !== note.title ||
        content !== note.content ||
        tags !== note.tags
      ) {
        debouncedSave({
          title,
          content,
          tags,
          lastModified: new Date(),
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    title,
    content,
    tags,
    note.title,
    note.content,
    note.tags,
    debouncedSave,
  ]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        debouncedSave({ title, content, tags, lastModified: new Date() });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [title, content, tags, debouncedSave]);

  const handleLineFocus = (index: number) => {
    setFocusedLineIndex(index);
    setEditingContent(lines[index] || "");
  };

  const handleLineInput = (
    e: React.FormEvent<HTMLDivElement>,
    index: number
  ) => {
    const newContent = e.currentTarget.textContent || "";
    setEditingContent(newContent);

    if (newContent.endsWith("/")) {
      const rect = e.currentTarget.getBoundingClientRect();
      setCommandMenuPosition({ top: rect.bottom, left: rect.left });
      setShowCommandMenu(true);
    } else {
      setShowCommandMenu(false);
    }
  };

  const handleLineBlur = (index: number) => {
    // Only update if the content actually changed
    if (editingContent !== lines[index]) {
      const newLines = [...lines];
      newLines[index] = editingContent;
      setLines(newLines);
      setContent(newLines.join("\n"));
    }
    setFocusedLineIndex(null);
    setShowCommandMenu(false);
  };

  const handleLineKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newLines = [...lines];
      newLines[index] = editingContent;
      newLines.splice(index + 1, 0, "");
      setLines(newLines);
      setContent(newLines.join("\n"));

      setTimeout(() => {
        setFocusedLineIndex(index + 1);
        setEditingContent("");
        contentEditableRefs.current[index + 1]?.focus();
      }, 0);
    } else if (
      e.key === "Backspace" &&
      editingContent === "" &&
      lines.length > 1
    ) {
      e.preventDefault();
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines);
      setContent(newLines.join("\n"));
      if (index > 0) {
        setTimeout(() => {
          setFocusedLineIndex(index - 1);
          contentEditableRefs.current[index - 1]?.focus();
        }, 0);
      }
    } else if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
      // Allow the "/" character to be typed normally
      // The command menu will be triggered in handleLineInput if needed
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      debouncedSave({ tags: updatedTags });
      setNewTag("");
      setTagInputOpen(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    debouncedSave({ tags: updatedTags });
  };

  const addCollaborator = (userId: string) => {
    if (!collaborators.includes(userId)) {
      const updatedCollaborators = [...collaborators, userId];
      setCollaborators(updatedCollaborators);
      debouncedSave({ collaborators: updatedCollaborators });
    }
  };

  const removeCollaborator = (userId: string) => {
    const updatedCollaborators = collaborators.filter((id) => id !== userId);
    setCollaborators(updatedCollaborators);
    debouncedSave({ collaborators: updatedCollaborators });
  };

  // Add command menu handler
  const handleCommandSelect = (command: string) => {
    if (focusedLineIndex !== null) {
      const newContent = editingContent.slice(0, -1) + command; // Remove the trailing "/" and add command
      setEditingContent(newContent);

      const newLines = [...lines];
      newLines[focusedLineIndex] = newContent;
      setLines(newLines);
      setContent(newLines.join("\n"));

      setShowCommandMenu(false);

      // Refocus on the content editable
      setTimeout(() => {
        contentEditableRefs.current[focusedLineIndex]?.focus();
        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        if (contentEditableRefs.current[focusedLineIndex] && sel) {
          range.selectNodeContents(
            contentEditableRefs.current[focusedLineIndex]!
          );
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 0);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 md:px-6 py-3 space-y-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
          <span className="hidden md:inline">Equal. Product Design Agency</span>
          <span className="hidden md:inline">/</span>
          <span className="hidden md:inline">UX audit & Nav Architecture</span>
          <span className="hidden md:inline">/</span>
          <span className="text-foreground font-medium truncate">
            {note.title}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setIsFavorite(!isFavorite);
                debouncedSave({ isFavorite: !isFavorite });
              }}
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite ? "fill-yellow-500 text-yellow-500" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShareOpen(true)}
            >
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-1 md:mr-2">
              {collaborators.slice(0, 2).map((userId) => {
                const user = mockUsers.find((u) => u.id === userId);
                if (!user) return null;
                return (
                  <Avatar
                    key={userId}
                    className="h-7 w-7 md:h-8 md:w-8 border-2 border-background"
                  >
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                );
              })}
              {collaborators.length > 2 && (
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{collaborators.length - 2}
                </div>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 md:h-8 md:w-8 bg-transparent"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <Command>
                  <CommandInput placeholder="Search team members..." />
                  <CommandList>
                    <CommandEmpty>No members found.</CommandEmpty>
                    <CommandGroup>
                      {mockUsers
                        .filter((u) => !collaborators.includes(u.id))
                        .map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => addCollaborator(user.id)}
                            className="cursor-pointer"
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage
                                src={user.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {user.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.role}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 md:px-6 py-4 md:py-6 max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="bg-blue-600/20 text-blue-400 border-0 group cursor-pointer hover:bg-blue-600/30"
              >
                <Hash className="h-3 w-3 mr-1" />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Popover open={tagInputOpen} onOpenChange={setTagInputOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1 bg-transparent"
                >
                  <Tag className="h-3 w-3" />
                  Add tag
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <Label>Add new tag</Label>
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter tag name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addTag();
                      }
                    }}
                  />
                  <Button onClick={addTag} size="sm" className="w-full">
                    Add Tag
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl md:text-4xl font-bold border-0 px-0 h-auto mb-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Untitled"
          />

          {/* Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 md:h-4 md:w-4" />
              <span>Created {note.createdAt.toLocaleDateString()}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>Last modified {note.lastModified.toLocaleString()}</span>
          </div>

          <div ref={editorRef} className="space-y-1 relative">
            {lines.map((line, index) => (
              <div key={index} className="group relative min-h-7">
                {focusedLineIndex === index ? (
                  <div
                    ref={(el) => {
                      contentEditableRefs.current[index] = el;
                      if (
                        el &&
                        focusedLineIndex === index &&
                        el.textContent === "" &&
                        editingContent !== ""
                      ) {
                        el.textContent = editingContent;
                      }
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => handleLineInput(e, index)}
                    onBlur={() => handleLineBlur(index)}
                    onFocus={() => handleLineFocus(index)}
                    onKeyDown={(e) => handleLineKeyDown(e, index)}
                    className="outline-none px-2 py-1 rounded cursor-text font-mono text-sm bg-muted/30 min-h-7"
                    data-placeholder={
                      !editingContent ? "Type / for commands" : ""
                    }
                  />
                ) : (
                  <div
                    onClick={() => {
                      handleLineFocus(index);
                      setTimeout(
                        () => contentEditableRefs.current[index]?.focus(),
                        0
                      );
                    }}
                    className="cursor-text px-2 py-1 rounded hover:bg-muted/50 transition-colors min-h-7"
                  >
                    {line.trim() ? (
                      <MarkdownRenderer content={line} />
                    ) : (
                      <span className="text-muted-foreground opacity-0 group-hover:opacity-50">
                        Empty line
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Command Menu */}
          {showCommandMenu && (
            <div
              className="fixed z-50 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
              style={{
                top: commandMenuPosition.top,
                left: commandMenuPosition.left,
              }}
            >
              <Command>
                <CommandInput placeholder="Search commands..." />
                <CommandList>
                  <CommandEmpty>No commands found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => handleCommandSelect("# Heading 1")}
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      Heading 1
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleCommandSelect("## Heading 2")}
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      Heading 2
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleCommandSelect("**bold**")}
                    >
                      <span className="font-bold mr-2">B</span>
                      Bold
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleCommandSelect("*italic*")}
                    >
                      <span className="italic mr-2">I</span>
                      Italic
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleCommandSelect("- List item")}
                    >
                      <span className="mr-2">•</span>
                      List item
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}

          {/* Linked Projects */}
          {linkedProjects.length > 0 && (
            <div className="mt-8 p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Linked Projects</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-2"
                  onClick={() => setLinkProjectOpen(true)}
                >
                  <LinkIcon className="h-3 w-3" />
                  Add Link
                </Button>
              </div>
              <div className="space-y-2">
                {linkedProjects.map((projectId) => {
                  const project = mockProjects.find((p) => p.id === projectId);
                  if (!project) return null;
                  return (
                    <div
                      key={projectId}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                    >
                      <span className="text-lg">{project.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {project.tasks.length} tasks
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collaborators */}
          {collaborators.length > 0 && (
            <div className="mt-6 p-4 border border-border rounded-lg">
              <h3 className="text-sm font-semibold mb-3">Collaborators</h3>
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map((userId) => {
                  const user = mockUsers.find((u) => u.id === userId);
                  if (!user) return null;
                  return (
                    <Avatar
                      key={userId}
                      className="h-8 w-8 border-2 border-background"
                    >
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  );
                })}
                {collaborators.length > 3 && (
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                    +{collaborators.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Link Project Dialog */}
      <Dialog open={linkProjectOpen} onOpenChange={setLinkProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link to Project</DialogTitle>
            <DialogDescription>
              Select projects to link this note with for collaboration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {mockProjects.map((project) => (
              <div key={project.id} className="flex items-center space-x-2">
                <Checkbox
                  id={project.id}
                  checked={linkedProjects.includes(project.id)}
                  onCheckedChange={(checked) => {
                    setLinkedProjects((prev) =>
                      checked
                        ? [...prev, project.id]
                        : prev.filter((id) => id !== project.id)
                    );
                  }}
                />
                <Label
                  htmlFor={project.id}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span>{project.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.description}
                    </p>
                  </div>
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkProjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setLinkProjectOpen(false)}>
              Save Links
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Note</DialogTitle>
            <DialogDescription>
              Manage collaborators for this note
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Add people</Label>
              <Command className="mt-2 border rounded-md">
                <CommandInput placeholder="Search team members..." />
                <CommandList>
                  <CommandEmpty>No members found.</CommandEmpty>
                  <CommandGroup>
                    {mockUsers
                      .filter((u) => !collaborators.includes(u.id))
                      .map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => {
                            addCollaborator(user.id);
                          }}
                          className="cursor-pointer"
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage
                              src={user.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback>
                              {user.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.role}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
            <div>
              <Label>Current collaborators</Label>
              <div className="mt-2 space-y-2">
                {collaborators.map((userId) => {
                  const user = mockUsers.find((u) => u.id === userId);
                  if (!user) return null;
                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {user.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.role}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollaborator(userId)}
                        disabled={userId === note.createdBy}
                      >
                        {userId === note.createdBy ? "Owner" : "Remove"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
