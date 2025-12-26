"use client";

import * as React from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Inbox,
  Bookmark,
  X,
  Sparkles,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useChannels, useCreateChannel } from "@/hooks/api/use-channels";
import { useProjects, useCreateProject } from "@/hooks/api/use-projects";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useDMConversations } from "@/hooks/api/use-dm";
import { WorkspaceSwitcher } from "../features/workspace/workspace-switcher";
import { UserProfileDialog } from "../features/social/user-profile-dialog";
import { ProjectCreateDialog } from "../features/projects/project-create-dialog";
import { StartDMDialog } from "../start-dm-dialog";
import { CreateChannelDialog } from "../features/chat/create-channel-dialog";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeChannel: string;
  onChannelSelect: (channelId: string) => void;
  onMembersClick?: () => void;
  currentWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  activeChannel,
  onChannelSelect,
  onMembersClick,
  currentWorkspaceId,
  onWorkspaceChange,
}: SidebarProps) {
  const { data: channelsData, isLoading: channelsLoading } = useChannels();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const createChannelMutation = useCreateChannel();
  const createProjectMutation = useCreateProject();
  const { data: dmConversations = [], isLoading: dmsLoading } = useDMConversations()

  const [favoritesOpen, setFavoritesOpen] = React.useState(true);
  const [channelsOpen, setChannelsOpen] = React.useState(true);
  const [directMessagesOpen, setDirectMessagesOpen] = React.useState(true);
  const [expandedChannels, setExpandedChannels] = React.useState<string[]>([
    "v3",
  ]);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [createChannelOpen, setCreateChannelOpen] = React.useState(false);
  const [projectsOpen, setProjectsOpen] = React.useState(true);
  const [expandedProjects, setExpandedProjects] = React.useState<string[]>([
    "project-1",
  ]);
  const [projectCreateOpen, setProjectCreateOpen] = React.useState(false);
  const [startDMOpen, setStartDMOpen] = React.useState(false)

  const channels = channelsData || [];
  const projects = projectsData || [];
  const session = useSession();
  const currentUser = session.data?.user;

  const router = useRouter();

  const handleChannelSelect = (channelId: string) => {
    onChannelSelect(channelId);
  };

  const handleAssistantClick = () => {
    router.push("/assistant");
    onClose();
  };

  const handleItemSelect = (id: string) => {
    if (id.startsWith("project-")) {
      router.push(`/projects/${id}`);
    } else {
      router.push(`/channels/${id}`);
    }
    onClose();
  };

  const toggleChannelExpansion = (channelId: string) => {
    setExpandedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleCreateChannel = (channelData: {
    name: string;
    type: string;
    description: string;
    isPrivate: boolean;
    icon?: string;
  }) => {
    createChannelMutation.mutate({
      name: channelData.name,
      description: channelData.description,
      isPrivate: channelData.isPrivate,
    });
  };

  const handleCreateProject = (projectData: {
    name: string;
    description: string;
    icon: string;
    members: string[];
    startDate?: Date;
    endDate?: Date;
  }) => {
    createProjectMutation.mutate({
      name: projectData.name,
      description: projectData.description,
      icon: projectData.icon,
      members: projectData.members,
      status: "active",
      progress: 0,
      startDate: projectData.startDate || new Date(),
      endDate:
        projectData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  };

  const renderChannel = (channel: any, level = 0) => {
    const hasChildren = channel.children && channel.children.length > 0;
    const isExpanded = expandedChannels.includes(channel.id);
    const paddingLeft = level === 0 ? "pl-2" : `pl-${2 + level * 4}`;

    return (
      <div key={channel.id}>
        <Button
          variant={activeChannel === channel.id ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-8 hover:bg-sidebar-accent text-sidebar-foreground",
            activeChannel === channel.id &&
              "bg-sidebar-accent text-sidebar-accent-foreground",
            paddingLeft,
            "pr-2"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleChannelExpansion(channel.id);
            } else {
              router.push(`/channels/${channel.id}`);
              onClose();
            }
          }}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "h-3 w-3 mr-1 transition-transform shrink-0",
                isExpanded && "rotate-90"
              )}
            />
          ) : (
            <span className="w-4 mr-1 shrink-0" />
          )}
          <span className="mr-2 shrink-0 text-base">{channel.icon}</span>
          <span className="flex-1 text-left truncate text-sm">
            {channel.name}
          </span>
          {channel.unreadCount && (
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 ml-auto shrink-0"
            >
              {channel.unreadCount}
            </Badge>
          )}
        </Button>
        {hasChildren && isExpanded && (
          <div>
            {channel.children.map((child: any) =>
              renderChannel(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderLoadingSkeleton = (count: number = 3) => {
    return Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center h-8 px-2 animate-pulse">
        <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
        <div className="h-3 flex-1 bg-gray-300 rounded"></div>
      </div>
    ));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header - Fixed */}
        <div className="h-14 border-b border-sidebar-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="font-semibold text-sidebar-foreground">Dealio</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Workspace Switcher */}
        <div className="border-b border-sidebar-border p-2 shrink-0">
          <WorkspaceSwitcher
            currentWorkspaceId={currentWorkspaceId}
            onWorkspaceChange={onWorkspaceChange}
          />
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Quick Actions */}
            <Button
              variant={activeChannel === "assistant" ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                activeChannel === "assistant" &&
                  "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              onClick={handleAssistantClick}
            >
              <Sparkles className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left text-sm">Assistant</span>
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 bg-blue-500/20 text-blue-400 border-0 shrink-0"
              >
                NEW
              </Badge>
            </Button>

            <Link href="/notes" onClick={onClose}>
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <FileText className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex-1 text-left text-sm">Notes</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Bookmark className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left text-sm">Drafts</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Bookmark className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left text-sm">Saved items</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Inbox className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex-1 text-left text-sm">Inbox</span>
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 shrink-0"
              >
                8
              </Badge>
            </Button>
          </div>

          {/* Projects Section */}
          <div className="mt-4">
            <div className="px-2 mb-1 flex items-center justify-between">
              <Button
                variant="ghost"
                className="flex-1 justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setProjectsOpen(!projectsOpen)}
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 mr-1 transition-transform shrink-0",
                    !projectsOpen && "-rotate-90"
                  )}
                />
                Projects
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setProjectCreateOpen(true)}
                title="Create project"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {projectsOpen && (
              <div className="px-2 space-y-0.5">
                {projectsLoading ? (
                  renderLoadingSkeleton(3)
                ) : projects.length > 0 ? (
                  projects.map((project) => {
                    const isExpanded = expandedProjects.includes(project.id);
                    return (
                      <div key={project.id}>
                        <Button
                          variant={
                            activeChannel === project.id ? "secondary" : "ghost"
                          }
                          className={cn(
                            "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                            activeChannel === project.id &&
                              "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                          onClick={() => {
                            router.push(`/projects/${project.id}`);
                            onClose();
                          }}
                        >
                          {project.tasks.length > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProjectExpansion(project.id);
                              }}
                              className="flex items-center mr-1 shrink-0"
                            >
                              <ChevronRight
                                className={cn(
                                  "h-3 w-3 transition-transform",
                                  isExpanded && "rotate-90"
                                )}
                              />
                            </button>
                          ) : (
                            <span className="w-4 mr-1 shrink-0" />
                          )}
                          <span className="mr-2 shrink-0 text-base">
                            {project.icon}
                          </span>
                          <span className="flex-1 text-left truncate text-sm">
                            {project.name}
                          </span>
                          {project.tasks.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0 shrink-0"
                            >
                              {project.tasks.length}
                            </Badge>
                          )}
                        </Button>
                        {isExpanded && project.tasks.length > 0 && (
                          <div className="ml-4 space-y-0.5 mt-0.5">
                            {project.tasks.map((task) => (
                              <Button
                                key={task.id}
                                variant={
                                  activeChannel === `task-${task.id}`
                                    ? "secondary"
                                    : "ghost"
                                }
                                className={cn(
                                  "w-full justify-start h-7 px-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent",
                                  activeChannel === `task-${task.id}` &&
                                    "bg-sidebar-accent text-sidebar-accent-foreground"
                                )}
                                onClick={() =>
                                  handleItemSelect(`task-${task.id}`)
                                }
                              >
                                <div
                                  className={cn(
                                    "h-2 w-2 rounded-full mr-2 shrink-0",
                                    task.status === "done" && "bg-green-500",
                                    task.status === "in-progress" &&
                                      "bg-blue-500",
                                    task.status === "todo" && "bg-gray-400"
                                  )}
                                />
                                <span className="flex-1 text-left truncate">
                                  {task.title}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No projects found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Direct messages */}
          <div className="px-2 py-2 mt-2">
            <div className="flex items-center justify-between mb-1">
              <Button
                variant="ghost"
                className="flex-1 justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setDirectMessagesOpen(!directMessagesOpen)}
              >
                <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", !directMessagesOpen && "-rotate-90")} />
                Direct messages
                <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-auto">
                  {dmConversations.length}
                </Badge>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStartDMOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {directMessagesOpen && (
              <div className="space-y-0.5">
                {dmsLoading ? (
                  <div className="text-center text-xs text-muted-foreground py-2">Loading...</div>
                ) : dmConversations.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-2">No conversations yet</div>
                ) : (
                  dmConversations.map((dm: any) => {
                    const otherUser = dm.members.find((m: any) => m.id !== dm.creatorId) || dm.members[0]
                    const dmId = `dm-${otherUser.id}`

                    return (
                      <Button
                        key={dm.id}
                        variant={activeChannel === dmId ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                          activeChannel === dmId && "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                        onClick={() => {
                          router.push(`/dm/${otherUser.id}`)
                          onClose()
                        }}
                      >
                        <div className="relative mr-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {otherUser.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "absolute bottom-0 right-0 h-2 w-2 border border-sidebar rounded-full",
                              otherUser.status === "online"
                                ? "bg-green-500"
                                : otherUser.status === "away"
                                  ? "bg-yellow-500"
                                  : "bg-gray-400",
                            )}
                          />
                        </div>
                        <span className="flex-1 text-left truncate text-sm">{otherUser.name}</span>
                        {dm._count?.messages > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {dm._count.messages}
                          </Badge>
                        )}
                      </Button>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Favorites Section */}
          <div className="mt-4">
            <div className="px-2 mb-1">
              <Button
                variant="ghost"
                className="w-full justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setFavoritesOpen(!favoritesOpen)}
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 mr-1 transition-transform shrink-0",
                    !favoritesOpen && "-rotate-90"
                  )}
                />
                Favorites
              </Button>
            </div>
            {favoritesOpen && (
              <div className="px-2 space-y-0.5">
                
              </div>
            )}
          </div>

          {/* Channels Section */}
          <div className="mt-4 pb-4">
            <div className="px-2 mb-1 flex items-center justify-between">
              <Button
                variant="ghost"
                className="flex-1 justify-start h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setChannelsOpen(!channelsOpen)}
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 mr-1 transition-transform shrink-0",
                    !channelsOpen && "-rotate-90"
                  )}
                />
                Channels
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setCreateChannelOpen(true)}
                title="Create channel"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {channelsOpen && (
              <div className="px-2 space-y-0.5">
                {channelsLoading ? (
                  renderLoadingSkeleton(4)
                ) : channels.length > 0 ? (
                  channels.map((channel) => renderChannel(channel))
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No channels found
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* User Profile Footer - Fixed */}
        <button
          className="h-14 border-t border-sidebar-border flex items-center gap-2 px-3 hover:bg-sidebar-accent transition-colors w-full text-left shrink-0"
          onClick={() => setProfileOpen(true)}
        >
          <div className="relative shrink-0">
            <Avatar className="h-8 w-8">
              <div className="text-xs bg-primary text-primary-foreground flex items-center justify-center h-full w-full">
                {currentUser?.image}
              </div>
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {currentUser?.name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-sidebar rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {currentUser?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              { "online"}
            </p>
          </div>
        </button>
      </aside>
        { currentUser &&
          <UserProfileDialog
            user={currentUser}
            open={profileOpen}
            onOpenChange={setProfileOpen}
          />
        }

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
      
      <StartDMDialog open={startDMOpen} onOpenChange={setStartDMOpen} />
    </>
  );
}
