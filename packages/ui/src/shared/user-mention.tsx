"use client";

import React, { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { CalendarDays, Mail, Shield, Loader2 } from "lucide-react";
import { useUsers } from "@repo/api-client";
import { cn } from "../lib/utils";
import { format } from "date-fns";

interface UserMentionProps {
  username: string;
  isSpecial?: boolean;
}

export function UserMention({ username, isSpecial }: UserMentionProps) {
  const { data: users, isLoading } = useUsers();
  const user = users?.find((u) => u.username?.toLowerCase() === username.toLowerCase() || u.name.toLowerCase() === username.toLowerCase());
  const [isOpen, setIsOpen] = useState(false);

  if (isSpecial) {
    return (
      <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1 rounded font-medium cursor-pointer hover:underline">
        @{username}
      </span>
    );
  }

  if (isLoading) {
    return (
      <span className="bg-primary/10 text-primary px-1 rounded font-medium inline-flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        @{username}
      </span>
    );
  }

  if (!user) {
    return (
      <span className="bg-primary/10 text-primary px-1 rounded font-medium">
        @{username}
      </span>
    );
  }

  const UserCard = () => (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <Avatar className="h-16 w-16 border-4 border-background shadow-sm">
          <AvatarImage src={user.avatar || user.image} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
           <Button size="sm" variant="outline">Profile</Button>
           <Button size="sm">Message</Button>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
           <h4 className="text-xl font-bold">{user.name}</h4>
           {user.username && <span className="text-muted-foreground text-sm">@{user.username}</span>}
        </div>
        <p className="text-sm text-muted-foreground capitalize">
          {user.role} • {user.status}
        </p>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 opacity-70" />
          <span>{user.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 opacity-70" />
          <span>{user.role} Team</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 opacity-70" />
          <span className="text-muted-foreground">
            Joined {user.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "December 2023"}
          </span>
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
              @{user.username || username}
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
