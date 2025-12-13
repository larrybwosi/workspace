"use client"

import * as React from "react"
import { use } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface DepartmentsPageProps {
  params: Promise<{ slug: string }>
}

export default function DepartmentsPage({ params }: DepartmentsPageProps) {
  const { slug } = use(params)
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const [departments] = React.useState([
    {
      id: "dept-1",
      name: "Engineering",
      icon: "💻",
      color: "#3b82f6",
      members: 45,
      channels: 8,
      description: "Software development team",
      manager: { name: "Alice Johnson", avatar: "AJ" },
    },
    {
      id: "dept-2",
      name: "Product",
      icon: "🎨",
      color: "#8b5cf6",
      members: 23,
      channels: 5,
      description: "Product management and design",
      manager: { name: "Bob Smith", avatar: "BS" },
    },
    {
      id: "dept-3",
      name: "Marketing",
      icon: "📢",
      color: "#22c55e",
      members: 18,
      channels: 6,
      description: "Marketing and communications",
      manager: { name: "Carol White", avatar: "CW" },
    },
    {
      id: "dept-4",
      name: "Sales",
      icon: "💼",
      color: "#f59e0b",
      members: 32,
      channels: 7,
      description: "Sales and business development",
      manager: { name: "David Brown", avatar: "DB" },
    },
  ])

  const filteredDepartments = departments.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <WorkspaceSidebar workspaceSlug={slug} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Departments</h1>
              <p className="text-sm text-muted-foreground">Manage your workspace departments and teams</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Department
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepartments.map((dept) => (
                <Card key={dept.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{dept.icon}</div>
                        <div>
                          <CardTitle className="text-lg">{dept.name}</CardTitle>
                          <CardDescription className="text-xs">{dept.description}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{dept.members} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>{dept.channels} channels</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" size="sm">
                      Manage Members
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
