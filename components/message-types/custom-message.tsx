"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/types"

interface CustomMessageProps {
  message: Message
}

interface UIDefinition {
  layout: "card" | "inline" | "modal"
  sections: Section[]
  actions?: Action[]
  theme?: {
    backgroundColor?: string
    borderColor?: string
    textColor?: string
  }
}

interface Section {
  type: "header" | "body" | "footer" | "field" | "list" | "grid"
  content?: string
  fields?: Field[]
  items?: any[]
  columns?: number
  className?: string
}

interface Field {
  type: "text" | "number" | "date" | "select" | "textarea" | "badge" | "progress" | "image"
  label?: string
  value: any
  options?: string[]
  className?: string
  editable?: boolean
}

interface Action {
  id: string
  label: string
  variant?: "default" | "destructive" | "outline" | "secondary"
  icon?: string
  position?: "inline" | "footer"
}

export function CustomMessage({ message }: CustomMessageProps) {
  const [uiDefinition, setUiDefinition] = React.useState<UIDefinition | null>(null)
  const [fieldValues, setFieldValues] = React.useState<Record<string, any>>({})

  React.useEffect(() => {
    // Parse UI definition from message metadata
    if (message.metadata?.uiDefinition) {
      try {
        const definition =
          typeof message.metadata.uiDefinition === "string"
            ? JSON.parse(message.metadata.uiDefinition)
            : message.metadata.uiDefinition
        setUiDefinition(definition)

        // Initialize field values
        const initialValues: Record<string, any> = {}
        definition.sections?.forEach((section: Section) => {
          section.fields?.forEach((field: Field) => {
            initialValues[field.label || ""] = field.value
          })
        })
        setFieldValues(initialValues)
      } catch (error) {
        console.error("[v0] Failed to parse UI definition:", error)
      }
    }
  }, [message.metadata])

  const handleFieldChange = (label: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [label]: value }))
  }

  const handleAction = (actionId: string) => {
    console.log("[v0] Custom message action:", actionId, fieldValues)
    // Emit action event with field values
    if (message.actions) {
      const action = message.actions.find((a) => a.id === actionId)
      action?.handler?.(message.id, actionId)
    }
  }

  const renderField = (field: Field) => {
    const value = fieldValues[field.label || ""] ?? field.value

    switch (field.type) {
      case "text":
      case "number":
        return field.editable ? (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.label || "", e.target.value)}
            className={field.className}
          />
        ) : (
          <span className={field.className}>{value}</span>
        )

      case "textarea":
        return field.editable ? (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.label || "", e.target.value)}
            className={field.className}
          />
        ) : (
          <p className={field.className}>{value}</p>
        )

      case "select":
        return field.editable ? (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.label || "", e.target.value)}
            className={cn("border rounded px-2 py-1", field.className)}
          >
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <span className={field.className}>{value}</span>
        )

      case "badge":
        return (
          <Badge variant="secondary" className={field.className}>
            {value}
          </Badge>
        )

      case "progress":
        return (
          <div className={cn("w-full bg-muted rounded-full h-2", field.className)}>
            <div className="bg-primary h-2 rounded-full" style={{ width: `${value}%` }} />
          </div>
        )

      case "image":
        return <img src={value || "/placeholder.svg"} alt={field.label} className={cn("rounded", field.className)} />

      default:
        return <span>{value}</span>
    }
  }

  const renderSection = (section: Section, index: number) => {
    switch (section.type) {
      case "header":
        return (
          <div key={index} className={cn("font-semibold text-lg mb-2", section.className)}>
            {section.content}
          </div>
        )

      case "body":
        return (
          <div key={index} className={cn("text-sm text-muted-foreground mb-3", section.className)}>
            {section.content}
          </div>
        )

      case "field":
        return (
          <div key={index} className={cn("space-y-2", section.className)}>
            {section.fields?.map((field, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                {field.label && <label className="text-sm font-medium">{field.label}</label>}
                {renderField(field)}
              </div>
            ))}
          </div>
        )

      case "list":
        return (
          <ul key={index} className={cn("space-y-1 list-disc list-inside", section.className)}>
            {section.items?.map((item, idx) => (
              <li key={idx} className="text-sm">
                {item}
              </li>
            ))}
          </ul>
        )

      case "grid":
        return (
          <div
            key={index}
            className={cn("grid gap-2", section.className)}
            style={{ gridTemplateColumns: `repeat(${section.columns || 2}, 1fr)` }}
          >
            {section.items?.map((item, idx) => (
              <div key={idx} className="p-2 border rounded">
                {item}
              </div>
            ))}
          </div>
        )

      case "footer":
        return (
          <div key={index} className={cn("text-xs text-muted-foreground mt-3 pt-3 border-t", section.className)}>
            {section.content}
          </div>
        )

      default:
        return null
    }
  }

  if (!uiDefinition) {
    return <div className="text-sm text-muted-foreground">{message.content}</div>
  }

  const inlineActions = uiDefinition.actions?.filter((a) => a.position === "inline")
  const footerActions = uiDefinition.actions?.filter((a) => !a.position || a.position === "footer")

  return (
    <Card
      className={cn("p-4", uiDefinition.layout === "inline" && "border-0 shadow-none p-0")}
      style={{
        backgroundColor: uiDefinition.theme?.backgroundColor,
        borderColor: uiDefinition.theme?.borderColor,
        color: uiDefinition.theme?.textColor,
      }}
    >
      {inlineActions && inlineActions.length > 0 && (
        <div className="flex gap-2 mb-3">
          {inlineActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "default"}
              size="sm"
              onClick={() => handleAction(action.id)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {uiDefinition.sections?.map((section, index) => renderSection(section, index))}

      {footerActions && footerActions.length > 0 && (
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {footerActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "default"}
              size="sm"
              onClick={() => handleAction(action.id)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  )
}
