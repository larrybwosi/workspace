"use client"

import * as React from "react"
import { Building2, Globe, Lock, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCreateWorkspace } from "@/hooks/api/use-workspaces"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const workspaceTemplates = [
  { id: "blank", name: "Blank Workspace", description: "Start from scratch", icon: Building2 },
  { id: "team", name: "Team Workspace", description: "For small to medium teams", icon: Users },
  { id: "enterprise", name: "Enterprise", description: "For large organizations", icon: Globe },
]

const workspaceIcons = ["🏢", "🚀", "💼", "🎯", "⚡", "🔥", "💡", "🌟", "🎨", "📊", "🔧", "🌐"]

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const [step, setStep] = React.useState(1)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [icon, setIcon] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [template, setTemplate] = React.useState("blank")
  const [visibility, setVisibility] = React.useState("private")
  const createWorkspace = useCreateWorkspace()

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, "-")) {
      setSlug(
        value
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createWorkspace.mutateAsync({ name, slug, icon, description })
      toast.success("Workspace created successfully")
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create workspace")
    }
  }

  const resetForm = () => {
    setStep(1)
    setName("")
    setSlug("")
    setIcon("")
    setDescription("")
    setTemplate("blank")
    setVisibility("private")
  }

  const handleClose = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create New Workspace
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Choose a template to get started quickly"}
            {step === 2 && "Configure your workspace details"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-6 py-4">
              {/* Template Selection */}
              <div className="space-y-3">
                <Label>Choose Template</Label>
                <div className="grid grid-cols-3 gap-3">
                  {workspaceTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50",
                        template === t.id ? "border-primary bg-primary/5" : "border-muted",
                      )}
                    >
                      <t.icon
                        className={cn("h-8 w-8 mb-2", template === t.id ? "text-primary" : "text-muted-foreground")}
                      />
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-3">
                <Label>Visibility</Label>
                <RadioGroup value={visibility} onValueChange={setVisibility} className="grid grid-cols-2 gap-3">
                  <Label
                    htmlFor="private"
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      visibility === "private" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50",
                    )}
                  >
                    <RadioGroupItem value="private" id="private" />
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Private</div>
                      <div className="text-xs text-muted-foreground">Only invited members</div>
                    </div>
                  </Label>
                  <Label
                    htmlFor="public"
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      visibility === "public" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50",
                    )}
                  >
                    <RadioGroupItem value="public" id="public" />
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Public</div>
                      <div className="text-xs text-muted-foreground">Anyone can discover</div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 py-4">
              {/* Icon Selection */}
              <div className="space-y-2">
                <Label>Workspace Icon</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg">
                    {icon || name?.charAt(0) || "W"}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {workspaceIcons.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setIcon(emoji)}
                          className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center text-lg transition-all",
                            icon === emoji ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80",
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="My Organization"
                  required
                  className="h-11"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Workspace URL
                  <span className="text-xs text-muted-foreground ml-2">(used in links)</span>
                </Label>
                <div className="flex items-center">
                  <span className="px-3 h-11 flex items-center bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
                    app.domain.com/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="my-organization"
                    pattern="[a-z0-9-]+"
                    required
                    className="rounded-l-none h-11"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your workspace and what it's for..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {step === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={createWorkspace.isPending || !name || !slug}>
                  {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
