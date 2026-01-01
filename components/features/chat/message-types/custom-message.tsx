"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  X,
  AlertCircle,
  Info,
  Send,
  Trash,
  Edit,
  Calendar as CalendarIcon,
  ChevronRight,
  User,
  MoreHorizontal,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Code as CodeIcon,
  CheckSquare,
  Terminal,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

// --- Types & Interfaces ---

export interface CustomMessageProps {
  message: Message;
  onAction?: (
    actionId: string,
    data: Record<string, any>
  ) => Promise<void> | void;
  readOnly?: boolean;
}

interface UIDefinition {
  layout: "card" | "inline" | "modal" | "banner";
  title?: string;
  description?: string;
  sections: Section[];
  actions?: Action[];
  theme?: {
    variant?: "default" | "destructive" | "success" | "warning" | "info";
    accentColor?: string;
  };
}

interface Section {
  id?: string;
  type: "header" | "body" | "footer" | "field" | "list" | "grid" | "divider";
  content?: string;
  fields?: Field[];
  items?: any[];
  columns?: number;
  className?: string;
  condition?: Condition;
}

interface Field {
  name: string;
  label?: string;
  type:
    | "text"
    | "number"
    | "date"
    | "select"
    | "textarea"
    | "badge"
    | "progress"
    | "image"
    | "checkbox"
    | "switch"
    | "code";
  value?: any;
  options?: string[] | { label: string; value: string }[];
  className?: string;
  editable?: boolean;
  placeholder?: string;
  description?: string;
  required?: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
  condition?: Condition;
}

interface Condition {
  field: string;
  operator: "equals" | "notEquals" | "contains" | "greaterThan";
  value: any;
}

interface Action {
  id: string;
  label: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  icon?: string;
  position?: "inline" | "footer";
  requiresValidation?: boolean;
}

// --- Helpers ---

const IconMap: Record<string, React.ElementType> = {
  check: Check,
  close: X,
  alert: AlertCircle,
  info: Info,
  send: Send,
  trash: Trash,
  edit: Edit,
  calendar: CalendarIcon,
  chevron: ChevronRight,
  user: User,
  more: MoreHorizontal,
  lock: Lock,
  code: CodeIcon,
  list: CheckSquare,
  terminal: Terminal,
};

const getIcon = (name?: string) => {
  if (!name) return null;
  const Icon = IconMap[name.toLowerCase()] || Info;
  return <Icon className="w-4 h-4 mr-2" />;
};

const checkCondition = (
  condition: Condition | undefined,
  values: Record<string, any>
): boolean => {
  if (!condition) return true;
  const targetValue = values[condition.field];

  switch (condition.operator) {
    case "equals":
      return targetValue == condition.value;
    case "notEquals":
      return targetValue != condition.value;
    case "contains":
      return Array.isArray(targetValue)
        ? targetValue.includes(condition.value)
        : String(targetValue).includes(String(condition.value));
    case "greaterThan":
      return Number(targetValue) > Number(condition.value);
    default:
      return true;
  }
};

/**
 * Automatically generates a UI Definition for messages that are implicitly code
 * or simple types without explicit definitions.
 */
const generateDefaultDefinition = (message: Message): UIDefinition | null => {
  // Check if message is explicitly type 'code' OR has implicit metadata
  if (message.messageType === "code" || message.metadata?.isImplicit) {
    const content = message.content || "";
    
    // Attempt to split text and code block: "Here is text...\n```json\n{...}\n```"
    const codeMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
    
    let code = content;
    let text = "";
    let language = message.metadata?.language || "text";

    if (codeMatch) {
        language = codeMatch[1] || language;
        code = codeMatch[2];
        text = content.replace(codeMatch[0], "").trim();
    }

    const sections: Section[] = [];
    
    // Add text preamble if it exists
    if (text) {
        sections.push({ 
            type: "body", 
            content: text,
            className: "mb-3"
        });
    }

    // Add the code block field
    sections.push({
      type: "field",
      fields: [
        {
          name: "code_content",
          type: "code",
          label: language.toUpperCase(),
          value: code, // FieldRenderer handles the display
          editable: false,
          className: "font-mono text-xs",
        },
      ],
    });

    return {
      layout: "card",
      // If there's a source in metadata, use it as description, otherwise generic
      title: message.metadata?.title || "Code Snippet",
      description: message.metadata?.source ? `Source: ${message.metadata.source}` : undefined,
      theme: { variant: "info" },
      sections,
      actions: [
        {
          id: "copy_code",
          label: "Copy Code",
          icon: "check", 
          variant: "ghost"
        }
      ]
    };
  }
  return null;
};

// --- Sub-Components ---

const FieldRenderer = ({
  field,
  value,
  onChange,
  error,
  readOnly,
}: {
  field: Field;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  readOnly: boolean;
}) => {
  const isEditable = field.editable !== false && !readOnly;
  const displayValue = value ?? field.value ?? "";

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className={cn("flex flex-col gap-1.5", field.className)}>
      {field.label && (
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            {field.type === "code" && <Terminal className="w-3 h-3" />}
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
        </div>
      )}
      {children}
      {error && (
        <span className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );

  // Read-only View for complex types
  if (!isEditable) {
    if (field.type === "code") {
      return (
        <Wrapper>
          <div className="relative group">
            <pre className="p-3 bg-slate-950 text-slate-50 rounded-md text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
              <code>{displayValue}</code>
            </pre>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                 navigator.clipboard.writeText(displayValue);
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </Wrapper>
      );
    }
    
    // Default read-only for other types
    if (field.type !== "badge" && field.type !== "progress" && field.type !== "image") {
       return (
        <Wrapper>
          <div
            className={cn(
              "text-sm px-3 py-2 bg-muted/30 border rounded-md text-foreground/80",
              field.type === "textarea" && "whitespace-pre-wrap"
            )}
          >
            {field.type === "switch" || field.type === "checkbox"
              ? displayValue ? "Yes" : "No"
              : String(displayValue)}
          </div>
        </Wrapper>
      );
    }
  }

  // Editable Views
  switch (field.type) {
    case "text":
    case "number":
      return (
        <Wrapper>
          <Input
            type={field.type}
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && "border-red-500 focus-visible:ring-red-500")}
          />
        </Wrapper>
      );
    case "textarea":
    case "code": // Editable code uses Textarea
      return (
        <Wrapper>
          <Textarea
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(
               "min-h-[80px] resize-y", 
               error && "border-red-500",
               field.type === "code" && "font-mono text-xs bg-slate-950 text-slate-50 border-slate-800 min-h-[150px]"
            )}
          />
        </Wrapper>
      );
    case "date":
      return (
        <Wrapper>
          <div className="relative">
            <Input
              type="date"
              value={displayValue}
              onChange={(e) => onChange(e.target.value)}
              className={cn("pl-9", error && "border-red-500")}
            />
            <CalendarIcon className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
          </div>
        </Wrapper>
      );
    case "select":
      const opts =
        field.options?.map((opt) =>
          typeof opt === "string" ? { label: opt, value: opt } : opt
        ) || [];
      return (
        <Wrapper>
          <select
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500"
            )}
          >
            <option value="" disabled>
              Select an option...
            </option>
            {opts.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Wrapper>
      );
    case "switch":
    case "checkbox":
      return (
        <Wrapper>
          <div className="flex items-center space-x-2 border p-3 rounded-md bg-background/50">
            <Switch
              checked={!!displayValue}
              onCheckedChange={(checked) => onChange(checked)}
              id={`switch-${field.name}`}
            />
            <label
              htmlFor={`switch-${field.name}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.placeholder || "Enable"}
            </label>
          </div>
        </Wrapper>
      );
    case "badge":
      return (
        <Wrapper>
          <div>
            <Badge
              variant="secondary"
              className={cn("px-2 py-0.5", field.className)}
            >
              {displayValue}
            </Badge>
          </div>
        </Wrapper>
      );
    case "progress":
      const progress = Math.min(100, Math.max(0, Number(displayValue) || 0));
      return (
        <Wrapper>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex-1 bg-secondary rounded-full h-2.5 overflow-hidden",
                field.className
              )}
            >
              <div
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground w-8 text-right">
              {progress}%
            </span>
          </div>
        </Wrapper>
      );
    case "image":
      return (
        <div
          className={cn(
            "relative overflow-hidden rounded-md border bg-muted",
            field.className
          )}
        >
          <img
            src={displayValue || "/placeholder.svg"}
            alt={field.label || "Message attachment"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    default:
      return null;
  }
};

const SectionRenderer = ({
  section,
  fieldValues,
  onFieldChange,
  errors,
  readOnly,
}: {
  section: Section;
  fieldValues: Record<string, any>;
  onFieldChange: (name: string, val: any) => void;
  errors: Record<string, string>;
  readOnly: boolean;
}) => {
  if (!checkCondition(section.condition, fieldValues)) return null;

  switch (section.type) {
    case "header":
      return (
        <div
          className={cn(
            "font-bold text-lg leading-tight tracking-tight mb-3 flex items-center gap-2",
            section.className
          )}
        >
          {section.content}
        </div>
      );
    case "body":
      return (
        <div
          className={cn(
            "text-sm text-foreground/80 leading-relaxed mb-4 whitespace-pre-line",
            section.className
          )}
        >
          {section.content}
        </div>
      );
    case "divider":
      return <hr className="my-4 border-border" />;
    case "field":
      return (
        <div className={cn("space-y-4 mb-4", section.className)}>
          {section.fields?.map((field, idx) => {
            if (!checkCondition(field.condition, fieldValues)) return null;

            return (
              <FieldRenderer
                key={`${field.name}-${idx}`}
                field={field}
                value={fieldValues[field.name]}
                onChange={(val) => onFieldChange(field.name, val)}
                error={errors[field.name]}
                readOnly={readOnly}
              />
            );
          })}
        </div>
      );
    case "list":
      return (
        <div className={cn("mb-4", section.className)}>
          <ul className="space-y-2">
            {section.items?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "grid":
      return (
        <div
          className={cn("grid gap-3 mb-4", section.className)}
          style={{
            gridTemplateColumns: `repeat(${
              section.columns || 2
            }, minmax(0, 1fr))`,
          }}
        >
          {section.items?.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-muted/40 rounded-lg text-sm border text-center font-medium"
            >
              {item}
            </div>
          ))}
        </div>
      );
    case "footer":
      return (
        <div
          className={cn(
            "text-xs text-muted-foreground mt-4 pt-3 border-t flex items-center gap-2",
            section.className
          )}
        >
          <Info className="w-3 h-3" />
          {section.content}
        </div>
      );
    default:
      return null;
  }
};

// --- Main Component ---

export function CustomMessage({
  message,
  onAction,
  readOnly = false,
}: CustomMessageProps) {
  const [uiDefinition, setUiDefinition] = React.useState<UIDefinition | null>(
    null
  );
  const [fieldValues, setFieldValues] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [hasError, setHasError] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Parse Definition or Generate Default
  React.useEffect(() => {
    let definition: UIDefinition | null = null;

    try {
      if (message.metadata?.uiDefinition) {
        definition =
          typeof message.metadata.uiDefinition === "string"
            ? JSON.parse(message.metadata.uiDefinition)
            : message.metadata.uiDefinition;
      } else {
        // Attempt to auto-generate if specific types are found without explicit definitions
        definition = generateDefaultDefinition(message);
      }

      if (definition) {
        setUiDefinition(definition);
        setHasError(false);

        const initialValues: Record<string, any> = { ...fieldValues };
        definition.sections?.forEach((section: Section) => {
          section.fields?.forEach((field: Field) => {
            if (field.name && initialValues[field.name] === undefined) {
              initialValues[field.name] = field.value;
            }
          });
        });
        setFieldValues(initialValues);
      } else {
        // Only error if it's strictly a custom type but failed generation
        if (message.messageType === 'custom') setHasError(true);
      }
    } catch (error) {
      console.error("Failed to parse UI definition:", error);
      setHasError(true);
    }
  }, [message.metadata, message.id, message.messageType]);

  const validateForm = (definition: UIDefinition): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    definition.sections.forEach((section) => {
      if (!checkCondition(section.condition, fieldValues)) return;
      section.fields?.forEach((field) => {
        if (!checkCondition(field.condition, fieldValues)) return;
        const val = fieldValues[field.name];
        if (
          field.required &&
          (val === undefined || val === "" || val === null)
        ) {
          newErrors[field.name] = "This field is required";
          isValid = false;
        }
        if (val && field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(String(val))) {
            newErrors[field.name] =
              field.validation.message || "Invalid format";
            isValid = false;
          }
        }
      });
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleAction = async (actionId: string) => {
    if (!uiDefinition) return;

    if (actionId === 'copy_code') {
       // Helper action specific to code cards
       const codeVal = fieldValues['code_content'] || message.content;
       navigator.clipboard.writeText(codeVal);
       return;
    }

    const actionDef = uiDefinition.actions?.find((a) => a.id === actionId);

    if (actionDef?.requiresValidation) {
      if (!validateForm(uiDefinition)) return;
    }

    setLoadingAction(actionId);

    const payload = {
      messageId: message.id,
      actionId,
      values: fieldValues,
      timestamp: new Date().toISOString(),
    };

    try {
      if (onAction) {
        await onAction(actionId, payload);
      }
      setIsVisible(false);
    } catch (e) {
      console.error("Action failed", e);
    } finally {
      setLoadingAction(null);
    }
  };

  if (hasError) {
    return (
      <Card className="p-4 border-destructive/50 bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive font-medium mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>Error rendering message</span>
        </div>
        <p className="text-sm text-muted-foreground">{message.content}</p>
      </Card>
    );
  }

  // If no UI definition could be generated (e.g. standard message with no special metadata)
  // return null so parent can fallback to standard render
  if (!uiDefinition) return null;

  const { layout, sections, actions, theme, title, description } = uiDefinition;

  // Styling
  const variantStyles = {
    default: "bg-background border-border",
    destructive: "bg-destructive/5 border-destructive/20",
    success:
      "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30",
    warning:
      "bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900/30",
    info: "bg-slate-50/50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800",
  };

  const containerClasses = cn(
    "relative overflow-hidden transition-all duration-200 group",
    layout === "inline" && "border-none shadow-none bg-transparent p-0",
    layout === "card" && "p-5 border shadow-sm rounded-xl",
    layout === "banner" && "p-4 border-l-4 rounded-r-md shadow-sm",
    theme?.variant ? variantStyles[theme.variant] : variantStyles.default
  );

  // Modal Render Logic
  if (layout === "modal") {
    return (
      <>
        {/* Trigger Button in Chat Stream */}
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)}>
          View: {title || "Message"}
        </Button>

        {/* Modal Portal */}
        {isVisible &&
          mounted &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
              <div
                className="absolute inset-0"
                onClick={() => setIsVisible(false)}
              />
              <Card className="relative w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => setIsVisible(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-bold mb-1">{title}</h2>
                {description && (
                  <p className="text-muted-foreground text-sm mb-4">
                    {description}
                  </p>
                )}

                <div className="space-y-1">
                  {sections?.map((section, index) => (
                    <SectionRenderer
                      key={index}
                      section={section}
                      fieldValues={fieldValues}
                      onFieldChange={(name, val) => {
                        setFieldValues((prev) => ({ ...prev, [name]: val }));
                        if (errors[name])
                          setErrors((prev) => ({ ...prev, [name]: "" }));
                      }}
                      errors={errors}
                      readOnly={readOnly}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t justify-end">
                  {actions?.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant || "default"}
                      onClick={() => handleAction(action.id)}
                      disabled={loadingAction !== null || readOnly}
                    >
                      {loadingAction === action.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        getIcon(action.icon)
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>,
            document.body
          )}
      </>
    );
  }

  // Standard Render
  return (
    <Card className={containerClasses}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {theme?.variant === "destructive" && (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      <div className="space-y-1">
        {sections?.map((section, index) => (
          <SectionRenderer
            key={index}
            section={section}
            fieldValues={fieldValues}
            onFieldChange={(name, val) => {
              if (readOnly) return;
              setFieldValues((prev) => ({ ...prev, [name]: val }));
              if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
            }}
            errors={errors}
            readOnly={readOnly}
          />
        ))}
      </div>

      {actions && actions.length > 0 && !readOnly && (
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "default"}
              size="sm"
              onClick={() => handleAction(action.id)}
              disabled={loadingAction !== null}
              className="flex-1 sm:flex-none"
            >
              {loadingAction === action.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                getIcon(action.icon)
              )}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {readOnly && (
        <div className="mt-4 pt-3 border-t flex justify-end">
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <Lock className="w-3 h-3" /> Read Only
          </Badge>
        </div>
      )}
    </Card>
  );
}