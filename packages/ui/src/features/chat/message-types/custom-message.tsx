'use client';

import * as React from 'react';
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
  Calendar,
  Send,
  User,
  Settings,
  Search,
  FileText,
} from 'lucide-react';
import { Button } from '../../../components/button';
import { Card } from '../../../components/card';
import { Badge } from '../../../components/badge';
import { Input } from '../../../components/input';
import { Textarea } from '../../../components/textarea';
import { Checkbox } from '../../../components/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/select';
import { Label } from '../../../components/label';
import { cn } from '../../../lib/utils';
import { MessageRenderer } from '../message-renderer';
import { CustomMessageSchema, type CustomMessage as ICustomMessage, type MessageNode } from '@repo/shared';

// --- Types & Interfaces ---

export interface CustomMessageProps {
  message: any;
  onAction?: (actionId: string, data: Record<string, any>) => Promise<void> | void;
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
  Calendar,
  Send,
  User,
  Settings,
  Search,
  FileText,
};

const getIcon = (name?: string, className?: string) => {
  if (!name) return null;
  const Icon = IconMap[name] || Info;
  return <Icon className={cn('w-4 h-4', className)} />;
};

// --- Form State Context ---

interface FormContextValue {
  values: Record<string, any>;
  setValue: (id: string, value: any) => void;
  errors: Record<string, string>;
  data: Record<string, any>;
}

const FormContext = React.createContext<FormContextValue | null>(null);

const useForm = () => {
  const context = React.useContext(FormContext);
  if (!context) throw new Error('useForm must be used within FormProvider');
  return context;
};

// --- Variable Resolver ---

const resolveVariables = (text: any, data: Record<string, any>, values: Record<string, any>) => {
  if (typeof text !== 'string') return text;

  // Combine static data and current form values for interpolation
  const combined = { ...data, ...values };

  return text.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], combined);
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
};

// --- Condition Evaluator ---

const evaluateCondition = (condition: any, values: Record<string, any>, data: Record<string, any>) => {
  if (!condition) return true;

  const { field, operator, value } = condition;
  const combined = { ...data, ...values };
  const fieldValue = combined[field];

  switch (operator) {
    case 'EQUALS': return fieldValue === value;
    case 'NOT_EQUALS': return fieldValue !== value;
    case 'CONTAINS': return Array.isArray(fieldValue) ? fieldValue.includes(value) : String(fieldValue).includes(value);
    case 'GREATER_THAN': return Number(fieldValue) > Number(value);
    case 'LESS_THAN': return Number(fieldValue) < Number(value);
    case 'EXISTS': return fieldValue !== undefined && fieldValue !== null;
    case 'NOT_EXISTS': return fieldValue === undefined || fieldValue === null;
    default: return true;
  }
};

// --- Validation Logic ---

const validateField = (node: MessageNode, value: any) => {
  const { validation } = node;
  if (!validation) return null;

  if (validation.required && (value === undefined || value === null || value === '')) {
    return validation.errorMessage || 'This field is required';
  }

  if (validation.pattern && !new RegExp(validation.pattern).test(String(value))) {
    return validation.errorMessage || 'Invalid format';
  }

  if (validation.minLength && String(value).length < validation.minLength) {
    return validation.errorMessage || `Minimum length is ${validation.minLength}`;
  }

  if (validation.maxLength && String(value).length > validation.maxLength) {
    return validation.errorMessage || `Maximum length is ${validation.maxLength}`;
  }

  return null;
};

// --- Plugin Component Registry ---

const ComponentRegistry: Record<string, React.FC<{ node: MessageNode }>> = {
  // Layout
  'Layout.Card': ({ node }) => {
    const { properties = {} } = node;
    return <Card className={cn('p-4 space-y-4', properties.className)}><ChildrenRenderer node={node} /></Card>;
  },
  'Layout.Stack': ({ node }) => {
    const { properties = {} } = node;
    return <div className={cn('flex flex-col gap-4', properties.className)}><ChildrenRenderer node={node} /></div>;
  },
  'Layout.Grid': ({ node }) => {
    const { properties = {} } = node;
    return (
      <div
        className={cn('grid gap-4', properties.className)}
        style={{ gridTemplateColumns: `repeat(${properties.columns || 1}, minmax(0, 1fr))` }}
      >
        <ChildrenRenderer node={node} />
      </div>
    );
  },

  // Display
  'Display.Field': ({ node }) => {
    const { properties = {} } = node;
    const { data, values } = useForm();
    return (
      <div className={cn('flex flex-col gap-1', properties.className)}>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {resolveVariables(properties.label, data, values)}
        </span>
        <div className="text-sm font-medium">
          {resolveVariables(properties.value, data, values)}
        </div>
      </div>
    );
  },
  'Text.Paragraph': ({ node }) => {
    const { properties = {} } = node;
    const { data, values } = useForm();
    return (
      <MessageRenderer
        content={resolveVariables(properties.content, data, values)}
        className={cn('text-sm', properties.className)}
      />
    );
  },
  'Text.Heading': ({ node }) => {
    const { properties = {} } = node;
    const { data, values } = useForm();
    return (
      <h4 className={cn('font-bold text-base', properties.className)}>
        {resolveVariables(properties.content, data, values)}
      </h4>
    );
  },

  // Inputs
  'Input.Text': ({ node }) => {
    const { id, properties = {} } = node;
    const { values, setValue, errors, data } = useForm();
    if (!id) return null;

    const error = errors[id];

    return (
      <div className="space-y-1.5">
        {properties.label && <Label htmlFor={id}>{resolveVariables(properties.label, data, values)}</Label>}
        {properties.multiline ? (
          <Textarea
            id={id}
            placeholder={resolveVariables(properties.placeholder, data, values)}
            value={values[id] || ''}
            onChange={(e) => setValue(id, e.target.value)}
            className={cn("min-h-[80px]", error && "border-destructive")}
          />
        ) : (
          <Input
            id={id}
            type={properties.inputType || 'text'}
            placeholder={resolveVariables(properties.placeholder, data, values)}
            value={values[id] || ''}
            onChange={(e) => setValue(id, e.target.value)}
            className={error ? "border-destructive" : ""}
          />
        )}
        {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
      </div>
    );
  },
  'Input.Select': ({ node }) => {
    const { id, properties = {} } = node;
    const { values, setValue, errors, data } = useForm();
    const [options, setOptions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    const error = errors[id || ''];

    React.useEffect(() => {
      const fetchOptions = async () => {
        const ds = properties.dataSource;
        if (!ds) return;

        if (ds.type === 'STATIC') {
          setOptions(ds.items || []);
        } else if (ds.type === 'VARIABLE') {
          setOptions(data[ds.key] || []);
        } else if (ds.type === 'API') {
          setLoading(true);
          try {
            const res = await fetch(ds.url, {
              method: ds.method || 'GET',
              headers: ds.headers,
            });
            const json = await res.json();
            // Simple mapping if defined
            const items = ds.map
              ? json.map((item: any) => ({ label: item[ds.map.label], value: item[ds.map.value] }))
              : json;
            setOptions(items);
          } catch (e) {
            console.error('Failed to fetch dynamic options', e);
          } finally {
            setLoading(false);
          }
        }
      };
      fetchOptions();
    }, [properties.dataSource, data]);

    if (!id) return null;

    return (
      <div className="space-y-1.5">
        {properties.label && <Label htmlFor={id}>{resolveVariables(properties.label, data, values)}</Label>}
        <Select value={values[id]} onValueChange={(val) => setValue(id, val)}>
          <SelectTrigger id={id} className={error ? "border-destructive" : ""}>
            <SelectValue placeholder={loading ? 'Loading...' : resolveVariables(properties.placeholder, data, values) || 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt: any) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
      </div>
    );
  },
  'Input.Checkbox': ({ node }) => {
    const { id, properties = {} } = node;
    const { values, setValue, errors, data } = useForm();
    if (!id) return null;

    const error = errors[id];

    return (
      <div className="space-y-1.5">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={id}
            checked={!!values[id]}
            onCheckedChange={(checked) => setValue(id, !!checked)}
            className={error ? "border-destructive" : ""}
          />
          {properties.label && (
            <Label htmlFor={id} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {resolveVariables(properties.label, data, values)}
            </Label>
          )}
        </div>
        {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
      </div>
    );
  },

  // Data
  'Data.StatsGrid': ({ node }) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
      <ChildrenRenderer node={node} />
    </div>
  ),
  'Data.Stat': ({ node }) => {
    const { properties = {} } = node;
    const { data, values } = useForm();
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          {resolveVariables(properties.label, data, values)}
        </span>
        <span className="text-xl font-bold">
          {resolveVariables(properties.value, data, values)}
        </span>
      </div>
    );
  },
};

// --- Recursive Node Renderer Helpers ---

const ChildrenRenderer = ({ node }: { node: MessageNode }) => {
  const { children = [] } = node;
  return (
    <>
      {children.map((child, idx) => (
        <NodeRenderer key={child.id || idx} node={child} />
      ))}
    </>
  );
};

const NodeRenderer = ({ node }: { node: MessageNode }) => {
  const { values, data } = useForm();

  if (!evaluateCondition(node.condition, values, data)) {
    return null;
  }

  const Component = ComponentRegistry[node.type];
  if (Component) {
    return <Component node={node} />;
  }

  return (
    <div className="p-2 border border-dashed rounded text-xs text-muted-foreground">
      Unknown Component: {node.type}
    </div>
  );
};

// --- Main Component ---

export function CustomMessage({ message, onAction, readOnly = false }: CustomMessageProps) {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const setValue = React.useCallback((id: string, value: any) => {
    setFormValues(prev => ({ ...prev, [id]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Parse and validate metadata
  const config = React.useMemo(() => {
    try {
      const result = CustomMessageSchema.safeParse(message.metadata);
      if (result.success) return result.data;
      console.error('Custom Message validation failed:', result.error);
      return null;
    } catch (e) {
      return null;
    }
  }, [message.metadata]);

  const handleAction = async (action: NonNullable<ICustomMessage['actions']>[number]) => {
    if (!config) return;

    // Validate all fields in the tree
    const newErrors: Record<string, string> = {};
    const validateNode = (node: MessageNode) => {
      if (!evaluateCondition(node.condition, formValues, config.data || {})) return;

      if (node.id) {
        const error = validateField(node, formValues[node.id]);
        if (error) newErrors[node.id] = error;
      }
      node.children?.forEach(validateNode);
    };
    validateNode(config.root);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoadingAction(action.id);
    try {
      if (onAction) {
        const payload: Record<string, any> = {
          messageId: message.id,
          ...action.handler.payload,
        };

        if (action.handler.includeFormState) {
          payload.formState = formValues;
        }

        await onAction(action.id, payload);
      }
    } catch (e) {
      console.error('Action failed', e);
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

  const { context, root, actions = [], data = {} } = config;

  return (
    <FormContext.Provider value={{ values: formValues, setValue, errors, data }}>
      <div className="w-full max-w-2xl space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
        <Card
          className={cn(
            'overflow-hidden border-border/60 shadow-sm',
            context.priority === 'urgent' && 'border-red-500/50 shadow-red-500/10'
          )}
        >
          {/* Header */}
          <div className="p-4 border-b bg-card/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {context.icon && (
                <div className="p-2 bg-primary/10 rounded-lg text-primary">{getIcon(context.icon, 'w-5 h-5')}</div>
              )}
              <div>
                <h3 className="font-semibold text-sm leading-none flex items-center gap-2">
                  {resolveVariables(context.title, data, formValues)}
                  {context.priority !== 'normal' && (
                    <Badge
                      variant={context.priority === 'urgent' ? 'destructive' : 'outline'}
                      className="text-[10px] h-4 px-1.5 uppercase"
                    >
                      {context.priority}
                    </Badge>
                  )}
                </h3>
                {context.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {resolveVariables(context.description, data, formValues)}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          {/* Content - Recursive Root */}
          <div className="p-4">
            <NodeRenderer node={root} />
          </div>

          {/* Actions */}
          {actions.length > 0 && !readOnly && (
            <div className="p-4 border-t bg-card/30 flex flex-wrap gap-2">
              {actions
                .filter(action => evaluateCondition(action.condition, formValues, data))
                .map(action => (
                  <Button
                    key={action.id}
                    variant={
                      action.type === 'PRIMARY'
                        ? 'default'
                        : action.type === 'DESTRUCTIVE'
                          ? 'destructive'
                          : action.type === 'GHOST'
                            ? 'ghost'
                            : 'outline'
                    }
                    size="sm"
                    className="flex-1 sm:flex-none h-9 gap-2"
                    onClick={() => handleAction(action)}
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === action.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      getIcon(action.icon, 'w-3.5 h-3.5')
                    )}
                    {resolveVariables(action.label, data, formValues)}
                  </Button>
                ))}
            </div>
          )}

          {readOnly && (
            <div className="p-2 border-t bg-muted/20 flex justify-center">
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground gap-1 border-none uppercase tracking-tighter"
              >
                <Lock className="w-2.5 h-2.5" /> Read Only
              </Badge>
            </div>
          )}
        </Card>

        {/* Footer Text / Status (Optional) */}
        {message.content && !message.content.startsWith('```') && (
          <p className="text-[10px] text-muted-foreground px-1 italic">{message.content}</p>
        )}
      </div>
    </FormContext.Provider>
  );
}
