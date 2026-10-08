'use client';

import * as React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '../../../components/card';
import { Badge } from '../../../components/badge';
import { Button } from '../../../components/button';
import { MarkdownRenderer } from '../../../shared/markdown-renderer';
import { cn } from '../../../lib/utils';

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

const cleanValue = (str: string): string => {
  if (!str) return '';
  return str.replace(/\*\*/g, '').replace(/`/g, '').trim();
};

export function parseSystemReport(content: string, metadata?: any): SystemReportData | null {
  if (!content) return null;

  // 1. Check if metadata explicitly defines system report data
  if (metadata?.type === 'system_report' || metadata?.systemReport) {
    return {
      title: cleanValue(metadata.title || 'System Notification'),
      type: metadata.reportType || 'system',
      severity: metadata.severity || 'info',
      httpStatus: metadata.httpStatus,
      fields: (metadata.fields || []).map((f: any) => ({
        ...f,
        label: cleanValue(f.label),
        value: cleanValue(f.value),
      })),
      summary: cleanValue(metadata.summary || content),
      timestamp: metadata.timestamp ? cleanValue(metadata.timestamp) : undefined,
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
  let title = cleanValue(firstLine.replace(/^[🚨⚠️ℹ️✅\s]+/, ''));

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

  // Helper matcher to extract multiline or inline key-value pairs
  const extractField = (labelPattern: string): string | null => {
    const regex = new RegExp(`(?:\\*\\*)?(?:${labelPattern})(?:\\*\\*)?:`, 'i');
    const match = content.match(regex);
    if (!match) return null;

    const startIndex = match.index! + match[0].length;
    let remainder = content.slice(startIndex);
    remainder = remainder.replace(/^\*+/, '');
    const nextLines = remainder.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return nextLines[0] ? cleanValue(nextLines[0]) : null;
  };

  const fields: SystemReportData['fields'] = [];
  let summary = '';

  // Extract Method / Path
  const methodVal = extractField('Method\\s*\\/\\s*Path|Path|Endpoint');
  if (methodVal) {
    fields.push({ label: 'Endpoint / Path', value: methodVal, isCode: true, copyable: true });
  }

  // Extract Error Code
  const errorCodeVal = extractField('Error Code|Code');
  if (errorCodeVal) {
    fields.push({ label: 'Error Code', value: errorCodeVal, isCode: true });
  }

  // Extract Message
  const messageVal = extractField('Message');
  if (messageVal) {
    summary = messageVal;
  }

  // Extract Correlation ID
  const correlationVal = extractField('Correlation ID|Request ID|Trace ID');
  if (correlationVal) {
    fields.push({ label: 'Correlation ID', value: correlationVal, isCode: true, copyable: true });
  }

  // Extract Tenant ID
  const tenantVal = extractField('Tenant ID|Organization ID');
  if (tenantVal) {
    fields.push({ label: 'Tenant ID', value: tenantVal, isCode: true, copyable: true });
  }

  // Extract Product Stock Alert patterns
  const productMatch = content.match(/(?:\*\*|\b)Product(?:\*\*|\b):\s*([^\n(]+)(?:\(ID:\s*([^)]+)\))?/i);
  if (productMatch) {
    fields.push({ label: 'Product', value: cleanValue(productMatch[1]) });
    if (productMatch[2]) {
      fields.push({ label: 'Product ID', value: cleanValue(productMatch[2]), isCode: true, copyable: true });
    }
  }

  const stockMatch = content.match(/(?:\*\*|\b)Current Stock(?:\*\*|\b):\s*(\d+)(?:\s*\(Threshold:\s*(\d+)\))?/i);
  if (stockMatch) {
    fields.push({ label: 'Current Stock', value: cleanValue(stockMatch[1]), isCode: true });
    if (stockMatch[2]) {
      fields.push({ label: 'Min Threshold', value: cleanValue(stockMatch[2]), isCode: true });
    }
  }

  // Extract Timestamp
  const timestampVal = extractField('Timestamp');
  const timestamp = timestampVal || undefined;

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
            <div className="font-semibold text-sm leading-tight text-foreground truncate">
              <MarkdownRenderer content={report.title} className="inline prose-p:inline prose-p:my-0 text-sm font-semibold" />
            </div>
            {report.type && (
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium block">
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
          <div className="text-xs text-foreground/90 font-medium bg-muted/30 p-2.5 rounded-lg border border-border/40 leading-relaxed">
            <MarkdownRenderer content={report.summary} className="text-xs text-foreground/90 font-medium prose-p:my-0" />
          </div>
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
