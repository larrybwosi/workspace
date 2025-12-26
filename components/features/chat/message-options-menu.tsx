"use client"
import { MoreVertical, Reply, Edit, Trash2, Pin, Copy, Forward, Flag, Bookmark, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MessageOptionsMenuProps {
  onReply?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onPin?: () => void
  onCopy?: () => void
  onForward?: () => void
  onFlag?: () => void
  onBookmark?: () => void
  onCopyLink?: () => void
}

export function MessageOptionsMenu({
  onReply,
  onEdit,
  onDelete,
  onPin,
  onCopy,
  onForward,
  onFlag,
  onBookmark,
  onCopyLink,
}: MessageOptionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onReply}>
          <Reply className="h-4 w-4 mr-2" />
          Reply to thread
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onForward}>
          <Forward className="h-4 w-4 mr-2" />
          Forward message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPin}>
          <Pin className="h-4 w-4 mr-2" />
          Pin message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onBookmark}>
          <Bookmark className="h-4 w-4 mr-2" />
          Save message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyLink}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onFlag}>
          <Flag className="h-4 w-4 mr-2" />
          Report message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete message
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
