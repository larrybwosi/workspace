"use client"
import { Download, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockUsers, mockProjects } from "@/lib/mock-data"

interface ProjectFile {
  id: string
  name: string
  type: string
  url: string
  icon: string
}

interface WorkActivity {
  id: string
  userId: string
  action: string
  taskName: string
  timestamp: Date
  type: "created" | "completed" | "meeting"
}

export function ProjectOverview() {
  const project = mockProjects[0]

  const files: ProjectFile[] = [
    { id: "1", name: "Photo", type: "docs.google.com", url: "#", icon: "🖼️" },
    { id: "2", name: "Figma (Old Design)", type: "figma.com", url: "#", icon: "🎨" },
    { id: "3", name: "StrataScratch - Structure.pdf", type: "Download", url: "#", icon: "📄" },
    { id: "4", name: "Brief.docx", type: "Download", url: "#", icon: "📝" },
    { id: "5", name: "Other Photos", type: "dropbox.com", url: "#", icon: "📸" },
  ]

  const activities: WorkActivity[] = [
    {
      id: "1",
      userId: "user-1",
      action: "created a task",
      taskName: "StrataScratch - Requirements Collection",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      type: "created",
    },
    {
      id: "2",
      userId: "user-1",
      action: "created a task",
      taskName: "StrataScratch - Home Page Prototype",
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      type: "created",
    },
    {
      id: "3",
      userId: "user-2",
      action: "completed the task",
      taskName: "StrataScratch - Home Page Prototype",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      type: "completed",
    },
    {
      id: "4",
      userId: "user-1",
      action: "created the meeting",
      taskName: "StrataScratch - Design Review",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      type: "meeting",
    },
  ]

  const projectStats = {
    createdTasks: 32,
    completedTasks: 6,
    inProgressTasks: 2,
    upcomingTasks: 24,
    progress: 19,
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return "today"
    if (diff === 1) return "1 day ago"
    if (diff < 7) return `${diff} days ago`
    if (diff < 14) return "1 week ago"
    return `${Math.floor(diff / 7)} weeks ago`
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl space-y-8">
          {/* Project Info */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Project Info</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{project.name} - The Place To Master Coding</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  StrataScratch is a data science interview platform that has over 900+ real interview questions from
                  your favorite companies. New questions include SQL and python coding, statistics, probability,
                  modeling, product sense, and system design.
                </p>
              </div>
            </div>
          </section>

          {/* Files & Links */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Files & Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {files.map((file) => (
                <Card key={file.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{file.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.type}</p>
                    </div>
                    {file.type === "Download" && <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  </div>
                </Card>
              ))}
              <Card className="p-4 border-dashed border-2 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </Card>
            </div>
          </section>

          {/* Work Progress */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Work Progress</h2>
            <div className="space-y-6">
              {/* Project Preparation */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Project Preparation</h3>
                </div>
                <div className="ml-7 space-y-3">
                  {activities
                    .filter((a) => a.type === "created")
                    .map((activity) => {
                      const user = mockUsers.find((u) => u.id === activity.userId)
                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                            <AvatarFallback className="text-xs">{user?.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-sm">
                            <span className="font-medium">{user?.name}</span>{" "}
                            <span className="text-muted-foreground">{activity.action}</span>{" "}
                            <span className="font-medium">{activity.taskName}</span>
                            <span className="text-muted-foreground ml-2">{formatTime(activity.timestamp)}</span>
                          </div>
                        </div>
                      )
                    })}
                  <Button variant="link" className="ml-9 p-0 h-auto text-sm text-primary">
                    Show 12 related tasks
                  </Button>
                </div>
              </div>

              {/* UX/UI */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-5 border-2 border-primary rounded flex items-center justify-center">
                    <div className="h-2 w-2 bg-primary rounded-sm" />
                  </div>
                  <h3 className="font-semibold">UX/UI</h3>
                </div>
                <div className="ml-7 space-y-3">
                  {activities
                    .filter((a) => a.type === "completed")
                    .map((activity) => {
                      const user = mockUsers.find((u) => u.id === activity.userId)
                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                            <AvatarFallback className="text-xs">{user?.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-sm">
                            <span className="font-medium">{user?.name}</span>{" "}
                            <span className="text-muted-foreground">{activity.action}</span>{" "}
                            <span className="font-medium">{activity.taskName}</span>
                            <span className="text-muted-foreground ml-2">{formatTime(activity.timestamp)}</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Meeting */}
              {activities
                .filter((a) => a.type === "meeting")
                .map((activity) => {
                  const user = mockUsers.find((u) => u.id === activity.userId)
                  return (
                    <Card key={activity.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold">27</div>
                          <div className="text-xs text-muted-foreground">May</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">{user?.name}</span>{" "}
                            <span className="text-muted-foreground">{activity.action}</span>{" "}
                            <span className="font-medium">{activity.taskName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">10:00 - 11:00 AM</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-border p-6 space-y-6">
        <section>
          <h3 className="text-sm font-semibold mb-4">Responsible</h3>
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="h-12 w-12">
              <AvatarImage src={mockUsers[0].avatar || "/placeholder.svg"} alt={mockUsers[0].name} />
              <AvatarFallback>{mockUsers[0].name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{mockUsers[0].name}</p>
              <p className="text-xs text-muted-foreground">Project Manager</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">13 May 2021</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated End Date</span>
              <span className="font-medium">10 Sep 2022</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">Corporate Website</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing Type</span>
              <span className="font-medium">Fix Price</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Project Status</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                According to plan
              </Badge>
            </div>
          </div>
        </section>

        <Separator />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Project progress</h3>
            <span className="text-2xl font-bold">{projectStats.progress}%</span>
          </div>
          <Progress value={projectStats.progress} className="h-2 mb-6" />

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Created tasks</span>
              </div>
              <p className="text-2xl font-bold">{projectStats.createdTasks}</p>
            </Card>
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Completed tasks</span>
              </div>
              <p className="text-2xl font-bold">{projectStats.completedTasks}</p>
            </Card>
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Tasks in progress</span>
              </div>
              <p className="text-2xl font-bold">{projectStats.inProgressTasks}</p>
            </Card>
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Upcoming tasks</span>
              </div>
              <p className="text-2xl font-bold">{projectStats.upcomingTasks}</p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
