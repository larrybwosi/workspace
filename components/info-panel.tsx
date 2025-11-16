"use client"
import { X, User, Calendar, Tag, CheckSquare, TrendingUp, Plus, Hash, MessageCircle, FileText, LinkIcon, Target, Clock, Phone, Video, UserPlus, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { mockThread, mockUsers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import React from "react"
import { MessageSearchPanel } from "./message-search-panel"

interface InfoPanelProps {
  isOpen: boolean
  onClose: () => void
  dmUser?: {
    id: string
    name: string
    avatar: string
    role: string
    status: string
  }
}

export function InfoPanel({ isOpen, onClose, dmUser }: InfoPanelProps) {
  const creator = mockUsers.find((u) => u.id === mockThread.creator)
  const members = mockUsers.filter((u) => mockThread.members.includes(u.id))
  const [activeTab, setActiveTab] = React.useState("info")
  const [activeView, setActiveView] = React.useState<"channel" | "project">("channel")
  const [selectedProject, setSelectedProject] = React.useState<any>(null)

  const handleStartCall = (type: string) => {
    // Placeholder for new call system logic
    console.log(`Starting ${type} call...`)
  }

  React.useEffect(() => {
    // This would be passed as a prop in real implementation
    const currentView = "channel" // or "project"
    setActiveView(currentView)
  }, [])

  if (dmUser) {
    return (
      <>
        {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

        <aside
          className={cn(
            "fixed lg:static inset-y-0 right-0 z-50 w-80 bg-card border-l border-border flex flex-col transition-transform duration-200 lg:translate-x-0",
            isOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
            <h2 className="font-semibold">Direct Message</h2>
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* DM User Profile */}
              <div className="flex flex-col items-center text-center space-y-3">
                <Avatar className="h-20 w-20">
                  <img src={dmUser.avatar || "/placeholder.svg"} alt={dmUser.name} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {dmUser.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{dmUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{dmUser.role}</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-2",
                      dmUser.status === "online" && "bg-green-500/10 text-green-600",
                      dmUser.status === "away" && "bg-yellow-500/10 text-yellow-600",
                      dmUser.status === "offline" && "bg-gray-500/10 text-gray-600",
                    )}
                  >
                    {dmUser.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent" 
                  size="sm"
                  onClick={() => handleStartCall('voice')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Start Call
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent" 
                  size="sm"
                  onClick={() => handleStartCall('video')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Start Video Call
                </Button>
                {/* </CHANGE> */}
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </div>

              <Separator />

              {/* Shared Files */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold mb-2">Shared Files</h3>
                <p className="text-sm text-muted-foreground">No files shared yet</p>
              </div>

              <Separator />

              {/* Conversation Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Conversation Info</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Messages</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      </>
    )
  }

  // Regular channel/project info panel
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Info Panel */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 right-0 z-50 w-80 bg-card border-l border-border flex flex-col transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex gap-1">
            <Button
              variant={activeTab === "info" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab("info")}
            >
              Info
            </Button>
            <Button
              variant={activeTab === "search" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab("search")}
            >
              Search
            </Button>
            <Button
              variant={activeTab === "activity" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab("activity")}
            >
              Activity
            </Button>
            <Button
              variant={activeTab === "files" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab("files")}
            >
              Files
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {activeTab === "search" ? (
          <MessageSearchPanel
            channelId={mockThread.channelId}
            onMessageClick={(messageId, channelId) => {
              window.location.href = `/channels/${channelId}?messageId=${messageId}`
            }}
          />
        ) : (
          <ScrollArea className="flex-1">
            {activeTab === "info" && activeView === "project" && selectedProject && (
              <div className="p-4 space-y-6">
                {/* Project Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Project Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Project Manager</span>
                      </div>
                      <span className="font-medium">Rustam Musalev</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Start Date</span>
                      </div>
                      <span className="font-medium">13 May 2021</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>End Date</span>
                      </div>
                      <span className="font-medium">10 Sep 2022</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >
                        According to plan
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>Category</span>
                      </div>
                      <span className="font-medium">Corporate Website</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Project Progress */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Project Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Overall Progress</span>
                        <span className="text-lg font-bold text-primary">19%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[19%]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Plus className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-muted-foreground">Created</span>
                        </div>
                        <p className="text-2xl font-bold">32</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckSquare className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-muted-foreground">Completed</span>
                        </div>
                        <p className="text-2xl font-bold">6</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                          <span className="text-xs text-muted-foreground">In Progress</span>
                        </div>
                        <p className="text-2xl font-bold">2</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span className="text-xs text-muted-foreground">Upcoming</span>
                        </div>
                        <p className="text-2xl font-bold">24</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Milestones */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Milestones</h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View all
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Project Preparation", status: "completed", progress: 100 },
                      { name: "UX/UI Design", status: "in-progress", progress: 65 },
                      { name: "Development", status: "upcoming", progress: 0 },
                    ].map((milestone, idx) => (
                      <div key={idx} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{milestone.name}</span>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              milestone.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : milestone.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            }
                          >
                            {milestone.status}
                          </Badge>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${milestone.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Team Members */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Team Members</h3>
                    <span className="text-xs text-muted-foreground">6 members</span>
                  </div>
                  <div className="space-y-2">
                    {members.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "info" && activeView === "channel" && (
              <div className="p-4 space-y-6">
                {/* Main Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Main info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Creator</span>
                      </div>
                      <span className="font-medium">{creator?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Date of creation</span>
                      </div>
                      <span className="font-medium">
                        {mockThread.dateCreated.toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >
                        {mockThread.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>Tags</span>
                      </div>
                      <span className="font-medium">{mockThread.tags.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckSquare className="h-4 w-4" />
                        <span>Tasks</span>
                      </div>
                      <span className="font-medium">{mockThread.tasks}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Linked Threads */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Linked threads</h3>
                  <div className="space-y-2">
                    {mockThread.linkedThreads.map((thread, idx) => (
                      <Button key={idx} variant="ghost" className="w-full justify-start text-sm h-auto py-2">
                        <Hash className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{thread}</span>
                        <Badge variant="secondary" className="ml-auto">
                          4
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Thread Activity */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Thread activity</h3>
                  <div className="flex items-center gap-1 h-8">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 rounded-sm",
                          i % 5 === 0 ? "bg-green-500" : i % 3 === 0 ? "bg-green-400" : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Members */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Members</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.status === "online" ? "Just now" : "Offline"}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            member.role === "Design" &&
                              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                            member.role === "Management" &&
                              "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                            member.role === "Development" &&
                              "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
                          )}
                        >
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Activity tab */}
            {activeTab === "activity" && (
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-3">
                    {[
                      { icon: MessageCircle, text: "12 new messages", time: "2 hours ago", color: "text-blue-500" },
                      { icon: FileText, text: "3 files uploaded", time: "5 hours ago", color: "text-green-500" },
                      { icon: CheckSquare, text: "2 tasks completed", time: "1 day ago", color: "text-purple-500" },
                      { icon: LinkIcon, text: "1 link shared", time: "2 days ago", color: "text-orange-500" },
                    ].map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm">
                        <activity.icon className={cn("h-4 w-4 mt-0.5", activity.color)} />
                        <div className="flex-1">
                          <p className="font-medium">{activity.text}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-3">Engagement Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Messages</span>
                      <span className="text-sm font-semibold">156</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reactions</span>
                      <span className="text-sm font-semibold">89</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Files Shared</span>
                      <span className="text-sm font-semibold">23</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Members</span>
                      <span className="text-sm font-semibold">6/9</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Files tab */}
            {activeTab === "files" && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Shared Files</h3>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    View all
                  </Button>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "design-system.fig", size: "2.4 MB", date: "Today" },
                    { name: "wireframes.pdf", size: "1.8 MB", date: "Yesterday" },
                    { name: "brand-guidelines.pdf", size: "3.2 MB", date: "2 days ago" },
                  ].map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.size} • {file.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </aside>
    </>
  )
}
