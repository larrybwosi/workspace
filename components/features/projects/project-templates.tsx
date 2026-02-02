"use client"
import * as React from "react"
import { Check, Copy, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  phases: number
  tasks: number
  isDefault: boolean
  icon: string
}

interface ProjectTemplatesProps {
  onSelectTemplate: (template: ProjectTemplate) => void
}

export function ProjectTemplates({ onSelectTemplate }: ProjectTemplatesProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedTemplate, setSelectedTemplate] = React.useState<ProjectTemplate | null>(null)
  const [projectName, setProjectName] = React.useState("")
  const [projectDescription, setProjectDescription] = React.useState("")

  const templates: ProjectTemplate[] = [
    {
      id: "template-1",
      name: "Software Development",
      description:
        "Complete software development lifecycle with planning, design, development, testing, and deployment phases",
      category: "Technology",
      phases: 5,
      tasks: 32,
      isDefault: true,
      icon: "💻",
    },
    {
      id: "template-2",
      name: "Marketing Campaign",
      description: "End-to-end marketing campaign with research, strategy, content creation, and analytics",
      category: "Marketing",
      phases: 4,
      tasks: 24,
      isDefault: true,
      icon: "📢",
    },
    {
      id: "template-3",
      name: "Product Launch",
      description:
        "Product launch workflow including market research, development, marketing, and post-launch analysis",
      category: "Product",
      phases: 6,
      tasks: 45,
      isDefault: true,
      icon: "🚀",
    },
    {
      id: "template-4",
      name: "Event Planning",
      description: "Comprehensive event planning with venue selection, vendor management, promotion, and execution",
      category: "Operations",
      phases: 4,
      tasks: 28,
      isDefault: false,
      icon: "🎉",
    },
    {
      id: "template-5",
      name: "Content Creation",
      description: "Content production workflow with ideation, creation, review, and publishing phases",
      category: "Creative",
      phases: 4,
      tasks: 18,
      isDefault: false,
      icon: "✍️",
    },
    {
      id: "template-6",
      name: "Research Project",
      description:
        "Academic or business research project with literature review, methodology, data collection, and analysis",
      category: "Research",
      phases: 5,
      tasks: 22,
      isDefault: false,
      icon: "🔬",
    },
  ]

  const handleUseTemplate = () => {
    if (selectedTemplate && projectName) {
      onSelectTemplate({
        ...selectedTemplate,
        name: projectName,
        description: projectDescription,
      })
      setOpen(false)
      resetForm()
    }
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setProjectName("")
    setProjectDescription("")
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Project Templates</h2>
        <p className="text-sm text-muted-foreground">
          Start with a pre-built template to save time and ensure best practices
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => {
              setSelectedTemplate(template)
              setOpen(true)
            }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{template.icon}</div>
                {template.isDefault && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Popular
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{template.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{template.phases} phases</span>
                <span>•</span>
                <span>{template.tasks} tasks</span>
              </div>

              <Badge variant="outline" className="text-xs">
                {template.category}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Use Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Customize your project details. The template structure will be copied to your new project.
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="text-4xl">{selectedTemplate.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold">{selectedTemplate.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {selectedTemplate.phases} phases
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {selectedTemplate.tasks} tasks
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Project Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe your project goals and objectives"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} disabled={!projectName}>
              <Copy className="h-4 w-4 mr-2" />
              Create from Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
