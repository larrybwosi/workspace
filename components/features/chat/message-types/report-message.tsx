"use client";

import * as React from "react";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  MoreHorizontal,
  ArrowRight,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Message, MessageMetadata } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Types ---

interface ReportData {
  title: string;
  type: "financial" | "analytics" | "status" | "audit";
  status: "draft" | "final" | "archived" | "review";
  date: string;
  summary: string;
  kpis?: KPI[];
  sections?: ReportSection[];
  footer?: string;
}

interface KPI {
  label: string;
  value: string | number;
  unit?: string;
  change?: number; // percentage
  trend?: "up" | "down" | "neutral";
  intent?: "positive" | "negative" | "neutral"; // e.g. costs going down is positive intent, trend down
}

interface ReportSection {
  title: string;
  content?: string; // Text content
  items?: string[]; // List items
  table?: {
    headers: string[];
    rows: (string | number)[][];
  };
}

interface ReportMessageProps {
  message: Message;
  metadata: MessageMetadata;
  className?: string;
}

// --- Sub-Components ---

const StatusBadge = ({ status }: { status: ReportData["status"] }) => {
  const styles = {
    draft:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    final:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    archived:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    review:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  };

  const icons = {
    draft: Clock,
    final: CheckCircle2,
    archived: FileText,
    review: AlertCircle,
  };

  const Icon = icons[status];

  return (
    <Badge
      variant="outline"
      className={cn("capitalize gap-1.5 pr-2.5", styles[status])}
    >
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
};

const KPICard = ({ kpi }: { kpi: KPI }) => {
  const isPositive = kpi.change && kpi.change > 0;
  const isNegative = kpi.change && kpi.change < 0;

  // Determine color based on intent and trend
  let trendColor = "text-muted-foreground";
  if (kpi.intent === "positive") {
    trendColor = isPositive
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  } else if (kpi.intent === "negative") {
    trendColor = isNegative
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  }

  return (
    <div className="p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {kpi.label}
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-1">
        {kpi.value}
        {kpi.unit && (
          <span className="text-sm font-normal text-muted-foreground">
            {kpi.unit}
          </span>
        )}
      </div>
      {kpi.change !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium",
            trendColor
          )}
        >
          {kpi.change > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : kpi.change < 0 ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          <span>{Math.abs(kpi.change)}%</span>
          <span className="text-muted-foreground opacity-70 font-normal ml-1">
            vs last period
          </span>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export function ReportMessage({ message, metadata }: ReportMessageProps) {
  // Parse data: Prefer metadata.reportData, fallback to parsing content JSON, fallback to error
  const reportData: ReportData | null = React.useMemo(() => {
    try {
      if (metadata?.reportData) return metadata.reportData as ReportData;
      // Attempt to find JSON block in content
      const jsonMatch =
        message.content.match(/```json\n([\s\S]*?)\n```/) ||
        message.content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      return null;
    } catch (e) {
      console.error("Failed to parse report data", e);
      return null;
    }
  }, [message.content, metadata]);

  if (!reportData) return null; // Fallback to standard renderer if parse fails

  const handleDownload = () => {
    // Mock download functionality
    console.log("Downloading report:", reportData.title);
  };

  const getHeaderIcon = (type: ReportData["type"]) => {
    switch (type) {
      case "financial":
        return BarChart3;
      case "analytics":
        return PieChart;
      case "audit":
        return CheckCircle2;
      default:
        return FileText;
    }
  };

  const HeaderIcon = getHeaderIcon(reportData.type);

  return (
    <Card className="w-full max-w-4xl overflow-hidden border-border/60 shadow-sm bg-background/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b bg-card">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
            <HeaderIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h3 className="font-semibold text-lg leading-none">
                {reportData.title}
              </h3>
              <StatusBadge status={reportData.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{reportData.date}</span>
              <span className="text-border">|</span>
              <span className="capitalize">{reportData.type} Report</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem>Share Report</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Executive Summary */}
        <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Executive Summary
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {reportData.summary}
          </p>
        </div>

        {/* KPIs Grid */}
        {reportData.kpis && reportData.kpis.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportData.kpis.map((kpi, idx) => (
              <KPICard key={idx} kpi={kpi} />
            ))}
          </div>
        )}

        {/* Sections */}
        {reportData.sections?.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h4 className="font-semibold text-sm">{section.title}</h4>
            </div>

            {/* Text Content */}
            {section.content && (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            )}

            {/* List Content */}
            {section.items && (
              <ul className="grid sm:grid-cols-2 gap-3">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {/* Table Content */}
            {section.table && (
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                      <tr>
                        {section.table.headers.map((h, i) => (
                          <th key={i} className="px-4 py-3 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {section.table.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="bg-background hover:bg-muted/20 transition-colors"
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={cn(
                                "px-4 py-3",
                                cIdx === 0 && "font-medium text-foreground",
                                typeof cell === "number" && "font-mono"
                              )}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {(reportData.footer || message.metadata?.footer) && (
        <div className="bg-muted/20 p-4 border-t text-xs text-center text-muted-foreground flex justify-center items-center gap-2">
          <span>
            {reportData.footer || "Generated automatically by AI Assistant"}
          </span>
          <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </Card>
  );
}
