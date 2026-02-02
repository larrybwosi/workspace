"use client"

import type React from "react"
import type { CustomMessageUIDefinition, CustomMessageComponent } from "./custom-message-schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Info } from "lucide-react"

export function renderCustomComponent(component: CustomMessageComponent, index = 0): React.ReactNode {
  const { type, props = {}, children = [] } = component

  switch (type) {
    case "text":
      return (
        <p key={index} className={`text-sm leading-relaxed ${props.className || ""}`}>
          {props.content}
        </p>
      )

    case "button":
      return (
        <Button
          key={index}
          variant={props.variant || "default"}
          size={props.size || "sm"}
          className={props.className}
          onClick={props.onClick}
        >
          {props.label}
        </Button>
      )

    case "badge":
      return (
        <Badge key={index} variant={props.variant || "default"} className={props.className}>
          {props.content}
        </Badge>
      )

    case "progress":
      return (
        <div key={index} className="space-y-2">
          {props.label && <p className="text-xs font-semibold">{props.label}</p>}
          <Progress value={props.value} className={props.className} />
          {props.showValue && <p className="text-xs text-muted-foreground">{props.value}%</p>}
        </div>
      )

    case "card":
      return (
        <Card key={index} className={`p-4 ${props.className || ""}`}>
          {props.title && <h4 className="font-semibold mb-2">{props.title}</h4>}
          {children.map((child, idx) => renderCustomComponent(child, idx))}
        </Card>
      )

    case "alert":
      const alertIcons = {
        success: <CheckCircle className="h-4 w-4" />,
        warning: <AlertTriangle className="h-4 w-4" />,
        error: <AlertTriangle className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
      }
      return (
        <Alert key={index} variant={props.variant || "default"} className={props.className}>
          {alertIcons[props.icon as keyof typeof alertIcons]}
          <AlertTitle>{props.title}</AlertTitle>
          <AlertDescription>{props.description}</AlertDescription>
        </Alert>
      )

    case "list":
      return (
        <ul key={index} className={`space-y-2 ${props.className || ""}`}>
          {props.items?.map((item: any, idx: number) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      )

    case "table":
      return (
        <div key={index} className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {props.headers?.map((header: string, idx: number) => (
                  <th key={idx} className="px-4 py-2 text-left font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.rows?.map((row: any[], rowIdx: number) => (
                <tr key={rowIdx} className="border-t">
                  {row.map((cell: any, cellIdx: number) => (
                    <td key={cellIdx} className="px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "timeline":
      return (
        <div key={index} className="space-y-4">
          {props.events?.map((event: any, idx: number) => (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                {idx !== props.events?.length - 1 && <div className="w-0.5 h-12 bg-border" />}
              </div>
              <div>
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                {event.description && <p className="text-sm mt-1">{event.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )

    case "approval":
      return (
        <div key={index} className="space-y-3 p-4 border rounded-lg bg-card">
          {props.title && <h4 className="font-semibold">{props.title}</h4>}
          {props.description && <p className="text-sm text-muted-foreground">{props.description}</p>}
          {props.details && (
            <div className="space-y-2">
              {Object.entries(props.details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="default">
              Approve
            </Button>
            <Button size="sm" variant="outline">
              Reject
            </Button>
          </div>
        </div>
      )

    default:
      return null
  }
}

export function CustomMessageRenderer({ definition }: { definition: CustomMessageUIDefinition }) {
  const getIcon = () => {
    const iconMap = {
      notification: "🔔",
      approval: "✅",
      update: "📝",
      alert: "⚠️",
      info: "ℹ️",
    }
    return definition.icon || iconMap[definition.type]
  }

  return (
    <div
      className={`space-y-4 p-4 rounded-lg border bg-card ${definition.color ? `border-[${definition.color}]/30` : ""}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-xl">{getIcon()}</span>
        <div className="flex-1">
          <h3 className="font-semibold flex items-center gap-2">
            {definition.title}
            {definition.priority !== "normal" && (
              <Badge variant={definition.priority === "urgent" ? "destructive" : "secondary"}>
                {definition.priority}
              </Badge>
            )}
          </h3>
          {definition.description && <p className="text-sm text-muted-foreground mt-1">{definition.description}</p>}
        </div>
      </div>

      {/* Components */}
      <div className="space-y-3">
        {definition.components.map((component, idx) => (
          <div key={idx}>{renderCustomComponent(component, idx)}</div>
        ))}
      </div>

      {/* Actions */}
      {definition.actions && definition.actions.length > 0 && (
        <div className="flex gap-2 pt-2">
          {definition.actions.map((action) => (
            <Button
              key={action.id}
              variant={
                action.type === "primary" ? "default" : action.type === "destructive" ? "destructive" : "outline"
              }
              size="sm"
              className="gap-2"
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Metadata */}
      {definition.metadata && (
        <div className="text-xs text-muted-foreground pt-2 border-t flex justify-between">
          <span>Source: {definition.metadata.source}</span>
          {definition.constraints?.expiresAt && (
            <span>Expires: {new Date(definition.constraints.expiresAt).toLocaleString()}</span>
          )}
        </div>
      )}
    </div>
  )
}
