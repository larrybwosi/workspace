'use client';

import * as React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Server,
  Code2,
  Clock,
  Copy,
  Check,
  ChevronRight,
  Database,
  Layers,
  Terminal,
  Activity,
  PackageCheck,
  Cpu,
} from 'lucide-react';
import { Card } from '../../../components/card';
import { Badge } from '../../../components/badge';
import { Button } from '../../../components/button';
import { cn } from '../../../lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

export interface SystemReportData {
  title: string;
  type?: 'exception' | 'stock' | 'system' | 'audit' | 'general';
  severity?: 'critical' | 'warning' | 'info' | 'success';
  httpStatus?: number | string;
  fields?: { label: string; value: string; isCode?: boolean; copyable?: boolean }[];
  summary?: string;
  timestamp?: string;
  rawText?: string;
}

interface SystemReportCardProps {
  report: SystemReportData;
  className?: string;
}

export function parseSystemReport(content: string, metadata?: any): SystemReportData | null {
  if (!content) return null;

  // 1. Check if metadata explicitly defines system report data
  if (metadata?.type === 'system_report' || metadata?.systemReport) {
    return {
      title: metadata.title || 'System Notification',
      type: metadata.reportType || 'system',
      severity: metadata.severity || 'info',
      httpStatus: metadata.httpStatus,
      fields: metadata.fields || [],
      summary: metadata.summary || content,
      timestamp: metadata.timestamp,
    };
  }

  // 2. Pattern detection for "System Exception Alert [HTTP XXX]" or "Low Stock Alert Report"
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || '';

  const isExceptionAlert = /System Exception Alert|Exception Alert|HTTP\s*\d{3}/i.test(firstLine) || /HTTP\s*5\d\d/i.test(content);
  const isStockAlert = /Stock Alert|Low Stock|Stock Threshold/i.test(content);

  if (!isExceptionAlert && !isStockAlert) {
    return null;
  }

  // Determine Severity & Type
  let severity: SystemReportData['severity'] = 'info';
  let type: SystemReportData['type'] = 'system';
  let title = firstLine.replace(/^[🚨⚠️ℹ️✅\s]+/, '');

  if (isExceptionAlert) {
    severity = 'critical';
    type = 'exception';
    if (!title) title = 'System Exception Alert';
  } else if (isStockAlert) {
    severity = 'warning';
    type = 'stock';
    if (!title) title = 'Low Stock Alert Report';
  }

  // Extract HTTP status code if present
  const httpMatch = content.match(/HTTP\s*(\d{3})/i);
  const httpStatus = httpMatch ? httpMatch[1] : undefined;

  // Extract Key-Value fields from patterns like:
  // "Method / Path:" followed by code block or line
  // "Product: Default (ID: cm...) Current Stock: 1"
  const fields: SystemReportData['fields'] = [];
  let summary = '';

  // Extract Method / Path
  const methodMatch = content.match(/(?:Method\s*\/\s*Path|Path|Endpoint):\s*(?:`{1,3})?\s*([^\n`]+)/i);
  if (methodMatch) {
    fields.push({ label: 'Endpoint / Path', value: methodMatch[1].trim(), isCode: true, copyable: true });
  }

  // Extract Error Code
  const errorCodeMatch = content.match(/(?:Error Code|Code):\s*(?:`{1,3})?\s*([^\n`]+)/i);
  if (errorCodeMatch) {
    fields.push({ label: 'Error Code', value: errorCodeMatch[1].trim(), isCode: true });
  }

  // Extract Message
  const messageMatch = content.match(/(?:Message):\s*([^\n`]+)/i);
  if (messageMatch) {
    summary = messageMatch[1].trim();
  }

  // Extract Correlation ID
  const correlationMatch = content.match(/(?:Correlation ID|Request ID|Trace ID):\s*(?:`{1,3})?\s*([^\n`]+)/i);
  if (correlationMatch) {
    fields.push({ label: 'Correlation ID', value: correlationMatch[1].trim(), isCode: true, copyable: true });
  }

  // Extract Tenant ID
  const tenantMatch = content.match(/(?:Tenant ID|Organization ID):\s*(?:`{1,3})?\s*([^\n`]+)/i);
  if (tenantMatch) {
    fields.push({ label: 'Tenant ID', value: tenantMatch[1].trim(), isCode: true, copyable: true });
  }

  // Extract Product Stock Alert patterns
  const productMatch = content.match(/Product:\s*([^\n(]+)(?:\(ID:\s*([^)]+)\))?/i);
  if (productMatch) {
    fields.push({ label: 'Product', value: productMatch[1].trim() });
    if (productMatch[2]) {
      fields.push({ label: 'Product ID', value: productMatch[2].trim(), isCode: true, copyable: true });
    }
  }

  const stockMatch = content.match(/Current Stock:\s*(\d+)(?:\s*\(Threshold:\s*(\d+)\))?/i);
  if (stockMatch) {
    fields.push({ label: 'Current Stock', value: stockMatch[1].trim(), isCode: true });
    if (stockMatch[2]) {
      fields.push({ label: 'Min Threshold', value: stockMatch[2].trim(), isCode: true });
    }
  }

  // Extract Timestamp
  const timestampMatch = content.match(/Timestamp:\s*([^\n]+)/i);
  const timestamp = timestampMatch ? timestampMatch[1].trim() : undefined;

  return {
    title,
    type,
    severity,
    httpStatus,
    fields,
    summary,
    timestamp,
    rawText: content,
  };
}

export function SystemReportCard({ report, className }: SystemReportCardProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getSeverityBadge = () => {
    switch (report.severity) {
      case 'critical':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
          icon: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
          badgeVariant: 'destructive' as const,
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
          badgeVariant: 'outline' as const,
        };
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
          badgeVariant: 'secondary' as const,
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
          icon: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
          badgeVariant: 'outline' as const,
        };
    }
  };

  const theme = getSeverityBadge();

  return (
    <Card
      className={cn(
        'w-full max-w-xl overflow-hidden border border-border/60 bg-card/90 shadow-sm rounded-xl my-2 transition-all hover:border-border',
        className
      )}
    >
      {/* Card Header */}
      <div className={cn('px-4 py-3 border-b border-border/40 flex items-center justify-between gap-3', theme.bg)}>
        <div className="flex items-center gap-2.5 min-w-0">
          {theme.icon}
          <div className="min-w-0">
            <h4 className="font-semibold text-sm leading-tight text-foreground truncate">{report.title}</h4>
            {report.type && (
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                {report.type} report
              </span>
            )}
          </div>
        </div>

        {report.httpStatus && (
          <Badge variant="outline" className="font-mono text-xs font-bold px-2 py-0.5 border-destructive/40 text-destructive bg-destructive/10 shrink-0">
            HTTP {report.httpStatus}
          </Badge>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {report.summary && (
          <p className="text-xs text-foreground/90 font-medium bg-muted/30 p-2.5 rounded-lg border border-border/40 leading-relaxed">
            {report.summary}
          </p>
        )}

        {/* Key-Value Metrics Grid */}
        {report.fields && report.fields.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {report.fields.map((field, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40 hover:border-border/80 transition-colors"
              >
                <span className="text-[11px] font-medium text-muted-foreground mb-1">{field.label}</span>
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span
                    className={cn(
                      'text-xs font-medium text-foreground truncate',
                      field.isCode && 'font-mono text-[11px] bg-background/80 px-1.5 py-0.5 rounded border border-border/50 text-foreground'
                    )}
                  >
                    {field.value}
                  </span>
                  {field.copyable && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted text-muted-foreground shrink-0 rounded"
                      onClick={() => copyToClipboard(field.value, idx)}
                      title="Copy value"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer / Timestamp */}
        {report.timestamp && (
          <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3 h-3" />
              <span>{report.timestamp}</span>
            </div>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">System Monitor</span>
          </div>
        )}
      </div>
    </Card>
  );
}
