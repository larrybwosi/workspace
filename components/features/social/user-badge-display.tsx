"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Shield, Star, Crown, Sparkles, Award, Zap, Heart, Trophy } from "lucide-react"

interface Badge {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  bgColor: string
  tier: "standard" | "premium" | "elite" | "legendary"
  category: string
  earnedAt?: Date
  isPrimary?: boolean
}

interface UserBadgeDisplayProps {
  badges: Badge[]
  maxDisplay?: number
  size?: "sm" | "md" | "lg"
  showTooltip?: boolean
  className?: string
}

const tierStyles = {
  standard: "ring-1 ring-border",
  premium: "ring-2 ring-blue-500/50",
  elite: "ring-2 ring-purple-500/50 shadow-purple-500/20 shadow-sm",
  legendary: "ring-2 ring-amber-500/50 shadow-amber-500/30 shadow-md animate-pulse",
}

const sizeStyles = {
  sm: "h-4 w-4 text-[10px]",
  md: "h-5 w-5 text-xs",
  lg: "h-6 w-6 text-sm",
}

const iconMap: Record<string, React.ComponentType<any>> = {
  shield: Shield,
  star: Star,
  crown: Crown,
  sparkles: Sparkles,
  award: Award,
  zap: Zap,
  heart: Heart,
  trophy: Trophy,
}

export function UserBadgeDisplay({
  badges,
  maxDisplay = 3,
  size = "md",
  showTooltip = true,
  className,
}: UserBadgeDisplayProps) {
  const displayBadges = badges.slice(0, maxDisplay)
  const remainingCount = badges.length - maxDisplay

  const renderBadge = (badge: Badge, index: number) => {
    const IconComponent = iconMap[badge.icon.toLowerCase()] || Award
    const isEmoji = badge.icon.length <= 2 || /\p{Emoji}/u.test(badge.icon)

    const badgeElement = (
      <div
        key={badge.id}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          sizeStyles[size],
          tierStyles[badge.tier],
          badge.isPrimary && "ring-2 ring-primary",
          className,
        )}
        style={{
          backgroundColor: badge.bgColor,
          color: badge.color,
        }}
      >
        {isEmoji ? (
          <span className="leading-none">{badge.icon}</span>
        ) : (
          <IconComponent
            className={cn(size === "sm" && "h-2.5 w-2.5", size === "md" && "h-3 w-3", size === "lg" && "h-3.5 w-3.5")}
          />
        )}
      </div>
    )

    if (!showTooltip) return badgeElement

    return (
      <HoverCard key={badge.id} openDelay={200}>
        <HoverCardTrigger asChild>{badgeElement}</HoverCardTrigger>
        <HoverCardContent className="w-64 p-3" side="top">
          <div className="flex items-start gap-3">
            <div
              className={cn("h-10 w-10 rounded-lg flex items-center justify-center", tierStyles[badge.tier])}
              style={{
                backgroundColor: badge.bgColor,
                color: badge.color,
              }}
            >
              {isEmoji ? <span className="text-lg">{badge.icon}</span> : <IconComponent className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{badge.name}</h4>
                <span
                  className={cn(
                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                    badge.tier === "legendary" && "bg-amber-500/20 text-amber-600",
                    badge.tier === "elite" && "bg-purple-500/20 text-purple-600",
                    badge.tier === "premium" && "bg-blue-500/20 text-blue-600",
                    badge.tier === "standard" && "bg-muted text-muted-foreground",
                  )}
                >
                  {badge.tier}
                </span>
              </div>
              {badge.description && <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>}
              {badge.earnedAt && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Earned {new Date(badge.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  if (badges.length === 0) return null

  return (
    <TooltipProvider>
      <div className="inline-flex items-center gap-0.5">
        {displayBadges.map((badge, index) => renderBadge(badge, index))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium cursor-pointer hover:bg-muted/80",
                  sizeStyles[size],
                )}
              >
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {remainingCount} more badge{remainingCount > 1 ? "s" : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
