"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Upload,
  Sparkles,
  Award,
  Users,
  MoreHorizontal,
  Shield,
  Star,
  Crown,
  Zap,
  Heart,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface CustomEmoji {
  id: string
  name: string
  shortcode: string
  imageUrl: string
  animated: boolean
  category: string
  isGlobal: boolean
  usageCount: number
  createdAt: Date
}

interface UserBadge {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  bgColor: string
  tier: "standard" | "premium" | "elite" | "legendary"
  category: string
  isGlobal: boolean
  assignedCount: number
  createdAt: Date
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

const BADGE_ICONS = [
  { icon: "shield", label: "Shield", component: Shield },
  { icon: "star", label: "Star", component: Star },
  { icon: "crown", label: "Crown", component: Crown },
  { icon: "sparkles", label: "Sparkles", component: Sparkles },
  { icon: "award", label: "Award", component: Award },
  { icon: "zap", label: "Zap", component: Zap },
  { icon: "heart", label: "Heart", component: Heart },
  { icon: "trophy", label: "Trophy", component: Trophy },
]

const BADGE_COLORS = [
  { color: "#ef4444", bg: "#fef2f2", name: "Red" },
  { color: "#f97316", bg: "#fff7ed", name: "Orange" },
  { color: "#eab308", bg: "#fefce8", name: "Yellow" },
  { color: "#22c55e", bg: "#f0fdf4", name: "Green" },
  { color: "#3b82f6", bg: "#eff6ff", name: "Blue" },
  { color: "#8b5cf6", bg: "#f5f3ff", name: "Purple" },
  { color: "#ec4899", bg: "#fdf2f8", name: "Pink" },
  { color: "#6b7280", bg: "#f9fafb", name: "Gray" },
]

const EMOJI_CATEGORIES = ["custom", "memes", "reactions", "brand", "animated"]
const BADGE_CATEGORIES = ["achievement", "role", "special", "event"]
const BADGE_TIERS = ["standard", "premium", "elite", "legendary"]

export function AdminEmojisBadges() {
  const [activeTab, setActiveTab] = React.useState("emojis")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [createEmojiOpen, setCreateEmojiOpen] = React.useState(false)
  const [createBadgeOpen, setCreateBadgeOpen] = React.useState(false)
  const [assignBadgeOpen, setAssignBadgeOpen] = React.useState(false)
  const [selectedBadge, setSelectedBadge] = React.useState<UserBadge | null>(null)

  // Form states
  const [emojiName, setEmojiName] = React.useState("")
  const [emojiShortcode, setEmojiShortcode] = React.useState("")
  const [emojiUrl, setEmojiUrl] = React.useState("")
  const [emojiCategory, setEmojiCategory] = React.useState("custom")
  const [emojiAnimated, setEmojiAnimated] = React.useState(false)
  const [emojiGlobal, setEmojiGlobal] = React.useState(false)

  const [badgeName, setBadgeName] = React.useState("")
  const [badgeDescription, setBadgeDescription] = React.useState("")
  const [badgeIcon, setBadgeIcon] = React.useState("star")
  const [badgeColor, setBadgeColor] = React.useState(BADGE_COLORS[4])
  const [badgeTier, setBadgeTier] = React.useState("standard")
  const [badgeCategory, setBadgeCategory] = React.useState("achievement")
  const [badgeGlobal, setBadgeGlobal] = React.useState(false)

  // Mock data
  const [customEmojis] = React.useState<CustomEmoji[]>([
    {
      id: "1",
      name: "Party Parrot",
      shortcode: "party_parrot",
      imageUrl: "/placeholder.svg?height=48&width=48",
      animated: true,
      category: "animated",
      isGlobal: true,
      usageCount: 1234,
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "This is Fine",
      shortcode: "this_is_fine",
      imageUrl: "/placeholder.svg?height=48&width=48",
      animated: false,
      category: "memes",
      isGlobal: false,
      usageCount: 892,
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "Stonks",
      shortcode: "stonks",
      imageUrl: "/placeholder.svg?height=48&width=48",
      animated: false,
      category: "memes",
      isGlobal: true,
      usageCount: 567,
      createdAt: new Date(),
    },
    {
      id: "4",
      name: "Company Logo",
      shortcode: "company_logo",
      imageUrl: "/placeholder.svg?height=48&width=48",
      animated: false,
      category: "brand",
      isGlobal: true,
      usageCount: 234,
      createdAt: new Date(),
    },
  ])

  const [userBadges] = React.useState<UserBadge[]>([
    {
      id: "1",
      name: "Early Adopter",
      description: "Joined during beta",
      icon: "star",
      color: "#eab308",
      bgColor: "#fefce8",
      tier: "premium",
      category: "special",
      isGlobal: true,
      assignedCount: 156,
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "Top Contributor",
      description: "Made significant contributions",
      icon: "trophy",
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      tier: "elite",
      category: "achievement",
      isGlobal: true,
      assignedCount: 42,
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "Admin",
      description: "System administrator",
      icon: "shield",
      color: "#ef4444",
      bgColor: "#fef2f2",
      tier: "legendary",
      category: "role",
      isGlobal: true,
      assignedCount: 5,
      createdAt: new Date(),
    },
    {
      id: "4",
      name: "Bug Hunter",
      description: "Found and reported bugs",
      icon: "zap",
      color: "#22c55e",
      bgColor: "#f0fdf4",
      tier: "standard",
      category: "achievement",
      isGlobal: false,
      assignedCount: 89,
      createdAt: new Date(),
    },
  ])

  const [users] = React.useState<User[]>([
    { id: "1", name: "John Doe", email: "john@example.com", avatar: "/placeholder.svg?height=40&width=40" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", avatar: "/placeholder.svg?height=40&width=40" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", avatar: "/placeholder.svg?height=40&width=40" },
  ])

  const filteredEmojis = customEmojis.filter(
    (emoji) =>
      emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emoji.shortcode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredBadges = userBadges.filter(
    (badge) =>
      badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateEmoji = () => {
    // API call would go here
    setCreateEmojiOpen(false)
    setEmojiName("")
    setEmojiShortcode("")
    setEmojiUrl("")
  }

  const handleCreateBadge = () => {
    // API call would go here
    setCreateBadgeOpen(false)
    setBadgeName("")
    setBadgeDescription("")
  }

  const handleAssignBadge = (userId: string) => {
    // API call would go here
    setAssignBadgeOpen(false)
    setSelectedBadge(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Emojis & Badges</h2>
          <p className="text-muted-foreground">Manage custom emojis and user badges for your workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custom Emojis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customEmojis.length}</div>
            <p className="text-xs text-muted-foreground">{customEmojis.filter((e) => e.animated).length} animated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBadges.length}</div>
            <p className="text-xs text-muted-foreground">
              {userBadges.filter((b) => b.tier === "legendary").length} legendary
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customEmojis.reduce((acc, e) => acc + e.usageCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">emoji reactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Badges Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBadges.reduce((acc, b) => acc + b.assignedCount, 0)}</div>
            <p className="text-xs text-muted-foreground">to users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="emojis" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Custom Emojis
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="h-4 w-4" />
              User Badges
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {activeTab === "emojis" ? (
              <Dialog open={createEmojiOpen} onOpenChange={setCreateEmojiOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Emoji
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Custom Emoji</DialogTitle>
                    <DialogDescription>Upload a custom emoji for your workspace</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                        {emojiUrl ? (
                          <img
                            src={emojiUrl || "/placeholder.svg"}
                            alt="Preview"
                            className="h-12 w-12 object-contain"
                          />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>Image URL</Label>
                        <Input
                          placeholder="https://example.com/emoji.png"
                          value={emojiUrl}
                          onChange={(e) => setEmojiUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Recommended: 128x128px, PNG or GIF</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="Party Parrot"
                          value={emojiName}
                          onChange={(e) => setEmojiName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Shortcode</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">:</span>
                          <Input
                            className="px-6"
                            placeholder="party_parrot"
                            value={emojiShortcode}
                            onChange={(e) =>
                              setEmojiShortcode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">:</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={emojiCategory} onValueChange={setEmojiCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EMOJI_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="capitalize">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-4 pt-6">
                        <div className="flex items-center justify-between">
                          <Label>Animated</Label>
                          <Switch checked={emojiAnimated} onCheckedChange={setEmojiAnimated} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Global</Label>
                          <Switch checked={emojiGlobal} onCheckedChange={setEmojiGlobal} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateEmojiOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEmoji}>Add Emoji</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={createBadgeOpen} onOpenChange={setCreateBadgeOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Badge
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Create User Badge</DialogTitle>
                    <DialogDescription>Design a badge to award to users</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "h-16 w-16 rounded-xl flex items-center justify-center shrink-0",
                          badgeTier === "legendary" && "ring-2 ring-amber-500/50 shadow-amber-500/30 shadow-md",
                          badgeTier === "elite" && "ring-2 ring-purple-500/50",
                          badgeTier === "premium" && "ring-2 ring-blue-500/50",
                          badgeTier === "standard" && "ring-1 ring-border",
                        )}
                        style={{ backgroundColor: badgeColor.bg, color: badgeColor.color }}
                      >
                        {(() => {
                          const IconComp = BADGE_ICONS.find((i) => i.icon === badgeIcon)?.component || Star
                          return <IconComp className="h-8 w-8" />
                        })()}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label>Badge Name</Label>
                          <Input
                            placeholder="Top Contributor"
                            value={badgeName}
                            onChange={(e) => setBadgeName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Awarded to users who..."
                            value={badgeDescription}
                            onChange={(e) => setBadgeDescription(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <div className="flex gap-2">
                        {BADGE_ICONS.map((item) => (
                          <Button
                            key={item.icon}
                            type="button"
                            variant={badgeIcon === item.icon ? "default" : "outline"}
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setBadgeIcon(item.icon)}
                          >
                            <item.component className="h-5 w-5" />
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        {BADGE_COLORS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            className={cn(
                              "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                              badgeColor.name === c.name ? "border-foreground scale-110" : "border-transparent",
                            )}
                            style={{ backgroundColor: c.color }}
                            onClick={() => setBadgeColor(c)}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tier</Label>
                        <Select value={badgeTier} onValueChange={setBadgeTier}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BADGE_TIERS.map((tier) => (
                              <SelectItem key={tier} value={tier} className="capitalize">
                                {tier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={badgeCategory} onValueChange={setBadgeCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BADGE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="capitalize">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <Label>Global Badge</Label>
                        <p className="text-xs text-muted-foreground">Available across all workspaces</p>
                      </div>
                      <Switch checked={badgeGlobal} onCheckedChange={setBadgeGlobal} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateBadgeOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateBadge}>Create Badge</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <TabsContent value="emojis" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Emoji</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Shortcode</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Usage</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmojis.map((emoji) => (
                    <TableRow key={emoji.id}>
                      <TableCell>
                        <div className="relative">
                          <img
                            src={emoji.imageUrl || "/placeholder.svg"}
                            alt={emoji.name}
                            className="h-8 w-8 object-contain"
                          />
                          {emoji.animated && (
                            <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground rounded px-0.5">
                              GIF
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{emoji.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">:{emoji.shortcode}:</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {emoji.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{emoji.usageCount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {emoji.isGlobal ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Global</Badge>
                        ) : (
                          <Badge variant="secondary">Workspace</Badge>
                        )}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Badge</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Assigned</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBadges.map((badge) => {
                    const IconComp = BADGE_ICONS.find((i) => i.icon === badge.icon)?.component || Award
                    return (
                      <TableRow key={badge.id}>
                        <TableCell>
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              badge.tier === "legendary" && "ring-2 ring-amber-500/50",
                              badge.tier === "elite" && "ring-2 ring-purple-500/50",
                              badge.tier === "premium" && "ring-2 ring-blue-500/50",
                              badge.tier === "standard" && "ring-1 ring-border",
                            )}
                            style={{ backgroundColor: badge.bgColor, color: badge.color }}
                          >
                            <IconComp className="h-5 w-5" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{badge.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {badge.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              badge.tier === "legendary" && "border-amber-500/50 text-amber-600",
                              badge.tier === "elite" && "border-purple-500/50 text-purple-600",
                              badge.tier === "premium" && "border-blue-500/50 text-blue-600",
                            )}
                          >
                            {badge.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {badge.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{badge.assignedCount}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedBadge(badge)
                                  setAssignBadgeOpen(true)
                                }}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Assign to User
                              </DropdownMenuItem>
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
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Badge Dialog */}
      <Dialog open={assignBadgeOpen} onOpenChange={setAssignBadgeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Badge</DialogTitle>
            <DialogDescription>Select a user to assign the "{selectedBadge?.name}" badge</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2 p-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => handleAssignBadge(user.id)}
                >
                  <Avatar>
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
