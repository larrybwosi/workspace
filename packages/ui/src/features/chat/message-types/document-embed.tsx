"use client";

import React from "react";
import { FileText, ExternalLink, Download, Clock } from "lucide-react";
import { Card } from "../../../components/card";
import { Button } from "../../../components/button";
import { Badge } from "../../../components/badge";
import { cn } from "../../../lib/utils";
import type { Message } from "../../../lib/types";

export interface DocumentEmbedProps {
  message: any;
}

export function DocumentEmbed({ message }: DocumentEmbedProps) {
  const { metadata, content } = message;

  if (message.messageType !== "document" && !metadata?.documentTitle) {
    return null;
  }

  const docTitle = (metadata as any)?.documentTitle || "Document";
  const docType = (metadata as any)?.documentType || "PDF";
  const docUrl = (metadata as any)?.documentUrl || "#";
  const docStatus = (metadata as any)?.documentStatus;
  const docId = (metadata as any)?.documentId;
  const docAmount = (metadata as any)?.documentAmount;

  return (
    <Card className="p-4 border-l-4 border-l-primary bg-muted/30 max-w-md my-2">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
          <FileText className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-sm truncate">{docTitle}</h4>
            <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
              {docType}
            </Badge>
          </div>

          {content && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {content}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
            {docId && (
              <span className="flex items-center gap-1">
                ID: <span className="text-foreground">{docId}</span>
              </span>
            )}
            {docAmount && (
              <span className="flex items-center gap-1">
                Amount: <span className="text-foreground">{docAmount}</span>
              </span>
            )}
            {docStatus && (
              <span className="flex items-center gap-1">
                Status: <span className={cn(
                  "px-1 rounded",
                  docStatus === "Approved" ? "bg-green-500/10 text-green-500" :
                  docStatus === "Pending" ? "bg-yellow-500/10 text-yellow-500" :
                  "bg-muted text-foreground"
                )}>{docStatus}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
        <Button variant="default" size="sm" className="h-8 text-xs flex-1" asChild>
          <a href={docUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3 mr-2" />
            View Document
          </a>
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs px-3" asChild title="Download">
           <a href={docUrl} download>
            <Download className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
