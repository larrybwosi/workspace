"use client"

import { useState } from "react"
import { Download, Search, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data
const mockAuditLogs = [
  {
    id: "1",
    action: "member.invited",
    actor: "John Doe",
    actorEmail: "john@example.com",
    target: "sarah@example.com",
    timestamp: "2024-06-01T10:30:00Z",
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    status: "success",
  },
  {
    id: "2",
    action: "settings.updated",
    actor: "Jane Smith",
    actorEmail: "jane@example.com",
    target: "Security settings",
    timestamp: "2024-05-28T14:20:00Z",
    ip: "192.168.1.2",
    userAgent: "Mozilla/5.0...",
    status: "success",
  },
  {
    id: "3",
    action: "project.created",
    actor: "Mike Johnson",
    actorEmail: "mike@example.com",
    target: "Q3 Marketing",
    timestamp: "2024-05-25T09:15:00Z",
    ip: "192.168.1.3",
    userAgent: "Mozilla/5.0...",
    status: "success",
  },
  {
    id: "4",
    action: "api_key.created",
    actor: "John Doe",
    actorEmail: "john@example.com",
    target: "Production API Key",
    timestamp: "2024-05-20T11:45:00Z",
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    status: "success",
  },
  {
    id: "5",
    action: "login.failed",
    actor: "Unknown",
    actorEmail: "attacker@example.com",
    target: "Workspace login",
    timestamp: "2024-05-18T03:30:00Z",
    ip: "185.220.100.240",
    userAgent: "curl/7.64.1",
    status: "failed",
  },
]

export function AuditLogsTab({ workspaceId }: { workspaceId: string }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [dateRange, setDateRange] = useState("30")

  const getActionBadgeColor = (action: string) => {
    if (action.includes("delete")) return "destructive"
    if (action.includes("create")) return "default"
    if (action.includes("update")) return "secondary"
    return "outline"
  }

  const getStatusBadgeColor = (status: string) => {
    return status === "success" ? "default" : "destructive"
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p className="text-muted-foreground">Track all activities and changes in your workspace</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Comprehensive log of all workspace actions</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="member">Member Actions</SelectItem>
                <SelectItem value="project">Project Actions</SelectItem>
                <SelectItem value="settings">Settings Changes</SelectItem>
                <SelectItem value="security">Security Events</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAuditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeColor(log.action)}>{log.action.replace(/\./g, " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.actor}</div>
                      <div className="text-xs text-muted-foreground">{log.actorEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{log.target}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeColor(log.status)}>{log.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retention Policy</CardTitle>
          <CardDescription>Configure how long audit logs are stored</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Audit Log Retention</p>
                <p className="text-sm text-muted-foreground">Logs older than this will be automatically deleted</p>
              </div>
              <Select defaultValue="90">
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
