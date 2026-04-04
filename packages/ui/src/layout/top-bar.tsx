"use client"

import * as React from "react"
import { Menu, Search, Bell, HelpCircle, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopBarProps {
  onMenuClick: () => void
  channelName: string
  channelDescription?: string
}

export function TopBar({ onMenuClick, channelName, channelDescription }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-lg truncate">{channelName}</h2>
          {channelDescription && (
            <p className="text-xs text-muted-foreground truncate">{channelDescription}</p>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9"
            />
          </div>
        </div>

        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            3
          </Badge>
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9">
          <HelpCircle className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
