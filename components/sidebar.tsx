"use client"

import * as React from "react"
import { Plus, ChevronDown, ChevronRight, Inbox, Bookmark, X, Sparkles, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { mockChannels, mockFavorites, mockUsers, mockProjects } from "@/lib/mock-data"
import { UserProfileDialog } from "./user-profile-dialog"
import { CreateChannelDialog } from "./create-channel-dialog"
import { ProjectCreateDialog } from "./project-create-dialog"
import { cn } from "@/lib/utils"
import { useChannels, useCreateChannel } from "@/hooks/api/use-channels"
import { useProjects, useCreateProject } from "@/hooks/api/use-projects"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  activeChannel: string
  onChannelSelect: (channelId: string) => void
  onMembersClick?: () => void
}

export function Sidebar({ isOpen, onClose, activeChannel, onChannelSelect, onMembersClick }: SidebarProps) {
  const { data: channelsData, isLoading: channelsLoading } = useChannels()
  const { data: projectsData, isLoading: projectsLoading } = useProjects()
  const createChannelMutation = useCreateChannel()
  const createProjectMutation = useCreateProject()

  const [favoritesOpen, setFavoritesOpen] = React.useState(true)
  const [channelsOpen, setChannelsOpen] = React.useState(true)
  const [directMessagesOpen, setDirectMessagesOpen] = React.useState(true)
  const [expandedChannels, setExpandedChannels] = React.useState<string[]>(["v3"])
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false)
  const [projectsOpen, setProjectsOpen] = React.useState(true)
  const [expandedProjects, setExpandedProjects] = React.useState<string[]>(["project-1"])
  const [projectCreateOpen, setProjectCreateOpen] = React.useState(false)
  const currentUser = mockUsers[0]

  const channels = channelsData || mockChannels
  const projects = projectsData || mockProjects

  const router = useRouter()

  const handleChannelSelect = (channelId: string) => {
    onChannelSelect(channelId)
  }

  const handleAssistantClick = () => {
    router.push("/assistant")
    onClose()
  }

  const handleItemSelect = (id: string) => {
    if (id.startsWith("project-")) {
      router.push(`/projects/${id}`)
    } else {
      router.push(`/channels/${id}`)
    }
    onClose()
  }

  const toggleChannelExpansion = (channelId: string) => {
    setExpandedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId],
    )
  }

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  const handleCreateChannel = (channelData: {
    name: string
    type: string
    description: string
    isPrivate: boolean
    icon?: string
  }) => {
    createChannelMutation.mutate({
      name: channelData.name,
      description: channelData.description,
      isPrivate: channelData.isPrivate,
      members: [currentUser.id],
      createdBy: currentUser.id,
      createdAt: new Date(),
    })
  }

  const handleCreateProject = (projectData: {
    name: string
    description: string
    icon: string
    members: string[]
  }) => {
    createProjectMutation.mutate({
      name: projectData.name,
      description: projectData.description,
      icon: projectData.icon,
      members: projectData.members,
      status: "active",
      progress: 0,
      startDate: new Date(),
      createdBy: currentUser.id,
    })
  }

  const renderChannel = (channel: any, level = 0) => {
    const hasChildren = channel.children && channel.children.length > 0
    const isExpanded = expandedChannels.includes(channel.id)

    return (
      <div key={channel.id}>
        <Button
          variant={activeChannel === channel.id ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-8 px-2 hover:bg-sidebar-accent text-sidebar-foreground",
            activeChannel === channel.id && "bg-sidebar-accent text-sidebar-accent-foreground",
            level > 0 && "pl-6",
          )}
          onClick={() => {
            if (hasChildren) {
              toggleChannelExpansion(channel.id)
            } else {
              router.push(`/channels/${channel.id}`)
              onClose()
            }
          }}
        >
          {hasChildren && (
            <ChevronRight
              className={cn("h-3 w-3 mr-1 transition-transform flex-shrink-0", isExpanded && "rotate-90")}
            />
          )}
          <span className="mr-2 flex-shrink-0 text-base">{channel.icon}</span>
          <span className="flex-1 text-left truncate text-sm">{channel.name}</span>
          {channel.unreadCount && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-auto">
              {channel.unreadCount}
            </Badge>
          )}
        </Button>
        {hasChildren && isExpanded && (
          <div className="ml-2">{channel.children.map((child: any) => renderChannel(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="h-14 border-b border-sidebar-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="font-semibold text-sidebar-foreground">Conceptzilla</h1>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {/* Quick Actions */}
            <Button
              variant={activeChannel === "assistant" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                activeChannel === "assistant" && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
              onClick={handleAssistantClick}
            >
              <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="flex-1 text-left text-sm">Assistant</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-blue-500/20 text-blue-400 border-0">
                NEW
              </Badge>
            </Button>

            {/* Notes navigation link */}
            <Link href="/notes" onClick={onClose}>
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="flex-1 text-left text-sm">Notes</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Bookmark className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="flex-1 text-left text-sm">Drafts</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Bookmark className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="flex-1 text-left text-sm">Saved items</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Inbox className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="flex-1 text-left text-sm">Inbox</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                8
              </Badge>
            </Button>
          </div>

          {/* Projects */}
          <div className="px-2 py-2 mt-2">
            <div className="flex items-center justify-between mb-1">
              <Button
                variant="ghost"
                className="flex-1 justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setProjectsOpen(!projectsOpen)}
              >
                <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", !projectsOpen && "-rotate-90")} />
                Projects
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setProjectCreateOpen(true)}
                title="Create project"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {projectsOpen && (
              <div className="space-y-0.5">
                {projects.map((project) => {
                  const isExpanded = expandedProjects.includes(project.id)
                  return (
                    <div key={project.id}>
                      <Button
                        variant={activeChannel === project.id ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                          activeChannel === project.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                        onClick={() => {
                          router.push(`/projects/${project.id}`)
                          onClose()
                        }}
                        onDoubleClick={() => {
                          if (project.tasks.length > 0) {
                            toggleProjectExpansion(project.id)
                          }
                        }}
                      >
                        {project.tasks.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleProjectExpansion(project.id)
                            }}
                            className="flex items-center"
                          >
                            <ChevronRight
                              className={cn(
                                "h-3 w-3 mr-1 transition-transform flex-shrink-0",
                                isExpanded && "rotate-90",
                              )}
                            />
                          </button>
                        )}
                        <span className="mr-2 flex-shrink-0 text-base">{project.icon}</span>
                        <span className="flex-1 text-left truncate text-sm">{project.name}</span>
                        {project.tasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {project.tasks.length}
                          </Badge>
                        )}
                      </Button>
                      {isExpanded && project.tasks.length > 0 && (
                        <div className="ml-6 space-y-0.5">
                          {project.tasks.map((task) => (
                            <Button
                              key={task.id}
                              variant={activeChannel === `task-${task.id}` ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start h-7 px-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent",
                                activeChannel === `task-${task.id}` &&
                                  "bg-sidebar-accent text-sidebar-accent-foreground",
                              )}
                              onClick={() => handleItemSelect(`task-${task.id}`)}
                            >
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full mr-2 flex-shrink-0",
                                  task.status === "done" && "bg-green-500",
                                  task.status === "in-progress" && "bg-blue-500",
                                  task.status === "todo" && "bg-gray-400",
                                )}
                              />
                              <span className="flex-1 text-left truncate">{task.title}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Direct messages */}
          <div className="px-2 py-2 mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent mb-1"
              onClick={() => setDirectMessagesOpen(!directMessagesOpen)}
            >
              <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", !directMessagesOpen && "-rotate-90")} />
              Direct messages
              <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-auto">
                {mockUsers.length - 1}
              </Badge>
            </Button>
            {directMessagesOpen && (
              <div className="space-y-0.5">
                {mockUsers.slice(1).map((user) => (
                  <Button
                    key={user.id}
                    variant={activeChannel === `dm-${user.id}` ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                      activeChannel === `dm-${user.id}` && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                    onClick={() => {
                      router.push(`/dm/${user.id}`)
                      onClose()
                    }}
                  >
                    <div className="relative mr-2">
                      <Avatar className="h-6 w-6">
                        <div className="text-xs bg-primary text-primary-foreground">{user.avatar}</div>
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute bottom-0 right-0 h-2 w-2 border border-sidebar rounded-full",
                          user.status === "online"
                            ? "bg-green-500"
                            : user.status === "away"
                              ? "bg-yellow-500"
                              : "bg-gray-400",
                        )}
                      />
                    </div>
                    <span className="flex-1 text-left truncate text-sm">{user.name}</span>
                    {user.id === "user-2" && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        1
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Favorites */}
          <div className="px-2 py-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent mb-1"
              onClick={() => setFavoritesOpen(!favoritesOpen)}
            >
              <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", !favoritesOpen && "-rotate-90")} />
              Favorites
            </Button>
            {favoritesOpen && (
              <div className="space-y-0.5">
                {mockFavorites.map((fav) => (
                  <Button
                    key={fav.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                      activeChannel === fav.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                    onClick={() => {
                      onChannelSelect(fav.id)
                      onClose()
                    }}
                  >
                    {fav.icon === "👤" ? (
                      <Avatar className="h-5 w-5 mr-2">
                        <div className="text-xs bg-primary text-primary-foreground">
                          {mockUsers.find((u) => u.name === fav.name)?.avatar}
                        </div>
                        <AvatarFallback className="text-xs">{fav.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="mr-2 flex-shrink-0 text-base">{fav.icon}</span>
                    )}
                    <span className="flex-1 text-left truncate text-sm">{fav.name}</span>
                    {fav.unreadCount && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {fav.unreadCount}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Channels */}
          <div className="px-2 py-2">
            <div className="flex items-center justify-between mb-1">
              <Button
                variant="ghost"
                className="flex-1 justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setChannelsOpen(!channelsOpen)}
              >
                <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", !channelsOpen && "-rotate-90")} />
                Channels
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCreateChannelOpen(true)}
                title="Create channel"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {channelsOpen && <div className="space-y-0.5">{channels.map((channel) => renderChannel(channel))}</div>}
          </div>
        </ScrollArea>

        {/* User profile footer - stays fixed at bottom */}
        <button
          className="h-14 border-t border-sidebar-border flex items-center gap-2 px-3 hover:bg-sidebar-accent transition-colors w-full text-left shrink-0"
          onClick={() => setProfileOpen(true)}
        >
          <div className="relative">
            <Avatar className="h-8 w-8">
              <div className="text-xs bg-primary text-primary-foreground">{currentUser.avatar}</div>
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-sidebar rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser.status}</p>
          </div>
        </button>
      </aside>

      <UserProfileDialog user={currentUser} open={profileOpen} onOpenChange={setProfileOpen} />

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        onCreateChannel={handleCreateChannel}
      />

      <ProjectCreateDialog
        open={projectCreateOpen}
        onOpenChange={setProjectCreateOpen}
        onCreateProject={handleCreateProject}
      />
    </>
  )
}
