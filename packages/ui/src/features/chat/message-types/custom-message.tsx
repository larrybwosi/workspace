"use client";

import * as React from "react";
import {
  Check,
  X,
  AlertCircle,
  Info,
  Loader2,
  Lock,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  BarChart,
  BarChart3,
} from "lucide-react";
import { Button } from "../../../components/button";
import { Card } from "../../../components/card";
import { Badge } from "../../../components/badge";
import { cn } from "../../../lib/utils";
import type { Message } from "../../../lib/types";
import { MessageRenderer } from "../message-renderer";
import {
  CustomMessageSchema,
  type CustomMessage as ICustomMessage,
  type MessageNode
} from "@repo/shared";

// --- Types & Interfaces ---

export interface CustomMessageProps {
  message: Message;
  onAction?: (
    actionId: string,
    data: Record<string, any>
  ) => Promise<void> | void;
  readOnly?: boolean;
}

// --- Icons Mapping ---

const IconMap: Record<string, React.ElementType> = {
  Check,
  X,
  AlertCircle,
  Info,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  BarChart,
  BarChart3,
};

const getIcon = (name?: string, className?: string) => {
  if (!name) return null;
  const Icon = IconMap[name] || Info;
  return <Icon className={cn("w-4 h-4", className)} />;
};

// --- Recursive Node Renderer ---

const NodeRenderer = ({
  node,
  data
}: {
  node: MessageNode;
  data?: Record<string, any>;
}) => {
  const { type, properties = {}, children = [] } = node;

  const renderChildren = () =>
    children.map((child, idx) => (
      <NodeRenderer key={child.id || idx} node={child} data={data} />
    ));

  switch (type) {
    // --- Layout Components ---
    case "Layout.Card":
      return (
        <Card className={cn("p-4 space-y-4", properties.className)}>
          {renderChildren()}
        </Card>
      );
    case "Layout.Stack":
      return (
        <div className={cn("flex flex-col gap-4", properties.className)}>
          {renderChildren()}
        </div>
      );
    case "Layout.Grid":
      return (
        <div
          className={cn("grid gap-4", properties.className)}
          style={{ gridTemplateColumns: `repeat(${properties.columns || 1}, minmax(0, 1fr))` }}
        >
          {renderChildren()}
        </div>
      );

    // --- Display Components ---
    case "Display.Field":
      return (
        <div className={cn("flex flex-col gap-1", properties.className)}>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {properties.label}
          </span>
          <div className="text-sm font-medium">
            {properties.value}
          </div>
        </div>
      );
    case "Text.Paragraph":
      return (
        <MessageRenderer
          content={properties.content}
          className={cn("text-sm", properties.className)}
        />
      );
    case "Text.Heading":
      return (
        <h4 className={cn("font-bold text-base", properties.className)}>
          {properties.content}
        </h4>
      );

    // --- Data Components ---
    case "Data.StatsGrid":
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          {renderChildren()}
        </div>
      );
    case "Data.Stat":
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{properties.label}</span>
          <span className="text-xl font-bold">{properties.value}</span>
        </div>
      );

    default:
      return (
        <div className="p-2 border border-dashed rounded text-xs text-muted-foreground">
          Unknown Component: {type}
        </div>
      );
  }
};

// --- Main Component ---

export function CustomMessage({
  message,
  onAction,
  readOnly = false,
}: CustomMessageProps) {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  // Parse and validate metadata
  const config = React.useMemo(() => {
    try {
      const result = CustomMessageSchema.safeParse(message.metadata);
      if (result.success) return result.data;

      // Legacy fallback for old custom messages if needed
      if (message.metadata?.uiDefinition) {
        // Here you would transform old format to new format
        // For now, return null to show error
      }

      console.error("Custom Message validation failed:", result.error);
      return null;
    } catch (e) {
      return null;
    }
  }, [message.metadata]);

  const handleAction = async (action: NonNullable<ICustomMessage['actions']>[number]) => {
    setLoadingAction(action.id);
    try {
      if (onAction) {
        await onAction(action.id, {
          messageId: message.id,
          ...action.handler.payload
        });
      }
    } catch (e) {
      console.error("Action failed", e);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!config) {
    return (
      <Card className="p-4 border-destructive/50 bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive font-medium mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>Invalid custom message configuration</span>
        </div>
        <MessageRenderer content={message.content} />
      </Card>
    );
  }

  const { context, root, actions = [] } = config;

  return (
    <div className="w-full max-w-2xl space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <Card className={cn(
        "overflow-hidden border-border/60 shadow-sm",
        context.priority === 'urgent' && "border-red-500/50 shadow-red-500/10"
      )}>
        {/* Header */}
        <div className="p-4 border-b bg-card/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {context.icon && (
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {getIcon(context.icon, "w-5 h-5")}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm leading-none flex items-center gap-2">
                {context.title}
                {context.priority !== 'normal' && (
                  <Badge variant={context.priority === 'urgent' ? 'destructive' : 'outline'} className="text-[10px] h-4 px-1.5 uppercase">
                    {context.priority}
                  </Badge>
                )}
              </h3>
              {context.description && (
                <p className="text-xs text-muted-foreground mt-1">{context.description}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Content - Recursive Root */}
        <div className="p-4">
          <NodeRenderer node={root} data={config.data} />
        </div>

        {/* Actions */}
        {actions.length > 0 && !readOnly && (
          <div className="p-4 border-t bg-card/30 flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={
                  action.type === 'PRIMARY' ? 'default' :
                  action.type === 'DESTRUCTIVE' ? 'destructive' :
                  action.type === 'GHOST' ? 'ghost' : 'outline'
                }
                size="sm"
                className="flex-1 sm:flex-none h-9 gap-2"
                onClick={() => handleAction(action)}
                disabled={loadingAction !== null}
              >
                {loadingAction === action.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  getIcon(action.icon, "w-3.5 h-3.5")
                )}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {readOnly && (
          <div className="p-2 border-t bg-muted/20 flex justify-center">
            <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1 border-none uppercase tracking-tighter">
              <Lock className="w-2.5 h-2.5" /> Read Only
            </Badge>
          </div>
        )}
      </Card>

      {/* Footer Text / Status (Optional) */}
      {message.content && !message.content.startsWith('```') && (
        <p className="text-[10px] text-muted-foreground px-1 italic">
          {message.content}
        </p>
      )}
    </div>
  );
}
