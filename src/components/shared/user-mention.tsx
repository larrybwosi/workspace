"use client";

import React, { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Mail, Shield } from "lucide-react";
import { mockUsers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface UserMentionProps {
  username: string;
  isSpecial?: boolean;
}

export function UserMention({ username, isSpecial }: UserMentionProps) {
  const user = mockUsers.find((u) => u.name.toLowerCase() === username.toLowerCase());
  const [isOpen, setIsOpen] = useState(false);

  if (isSpecial || !user) {
    const colorClass = isSpecial
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-primary/10 text-primary";
    return (
      <span className={cn(colorClass, "px-1 rounded font-medium cursor-pointer hover:underline")}>
        @{username}
      </span>
    );
  }

  const UserCard = () => (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <Avatar className="h-16 w-16 border-4 border-background shadow-sm">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
           <Button size="sm" variant="outline">Profile</Button>
           <Button size="sm">Message</Button>
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-xl font-bold">@{user.name}</h4>
        <p className="text-sm text-muted-foreground">
          {user.role} • {user.status}
        </p>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 opacity-70" />
          <span>{user.name.toLowerCase()}@example.com</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 opacity-70" />
          <span>{user.role} Team</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 opacity-70" />
          <span className="text-muted-foreground">Joined December 2023</span>
        </div>
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <PopoverTrigger asChild>
            <span
              className="bg-primary/10 text-primary px-1 rounded font-medium cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(true);
              }}
            >
              @{username}
            </span>
          </PopoverTrigger>
        </HoverCardTrigger>
        <HoverCardContent className="w-80" align="start">
          <UserCard />
        </HoverCardContent>
      </HoverCard>
      <PopoverContent className="w-80" align="start">
        <UserCard />
      </PopoverContent>
    </Popover>
  );
}
