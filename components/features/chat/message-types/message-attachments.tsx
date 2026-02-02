"use client";

import { FileIcon } from "lucide-react";
import type { Attachment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageAttachmentsProps {
  attachments?: Attachment[];
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-2 grid gap-2 grid-cols-1 sm:grid-cols-2 max-w-lg">
      {attachments.map((attachment) => {
        const extension =
          attachment.name.split(".").pop()?.toLowerCase() || "default";
        const isSanityImage = ["png", "jpg", "jpeg"].includes(extension);

        // 1. Image Rendering Logic (Sanity Optimized)
        if (isSanityImage && attachment.url) {
          // Check if URL already has params to decide between '?' and '&'
          const querySymbol = attachment.url.includes("?") ? "&" : "?";
          const optimizedUrl = `${attachment.url}${querySymbol}fm=webp`;

          return (
            <a
              key={attachment.id}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group relative overflow-hidden rounded-lg border border-border bg-background",
                "hover:opacity-90 transition-opacity cursor-pointer",
                // Make images slightly taller/aspect-ratio based
                "aspect-video w-full flex items-center justify-center bg-muted/30"
              )}
            >
              <img
                src={optimizedUrl}
                alt={attachment.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </a>
          );
        }

        // 2. Standard File Rendering Logic (Your existing code)
        return (
          <a
            key={attachment.id}
            href={attachment.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group flex items-center gap-3 p-2 border border-border rounded-lg bg-card",
              "hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden"
            )}
          >
            {/* File Icon Rendering */}
            <div className="h-10 w-10 shrink-0 rounded bg-background/50 flex items-center justify-center border border-border/50 overflow-hidden">
              <img
                src={`/${extension}.svg`}
                alt={attachment.name}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
              {/* Fallback Icon */}
              <FileIcon className="h-5 w-5 text-muted-foreground hidden" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-medium truncate text-foreground/90 group-hover:text-primary transition-colors">
                {attachment.name}
              </p>
              {attachment.size && (
                <p className="text-xs text-muted-foreground">
                  {attachment.size}
                </p>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
