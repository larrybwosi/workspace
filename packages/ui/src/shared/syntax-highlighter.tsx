"use client";

import * as React from "react";
import { Check, Copy, FileCode, WrapText } from "lucide-react";
import { Prism as SyntaxHighlighterPrism } from "react-syntax-highlighter";
import { oneDark, prism } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "../components/button";
import { cn } from "../lib/utils";
import { useTheme } from "../layout/theme-provider";

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  fileName?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export function SyntaxHighlighter({
  code,
  language,
  fileName,
  className,
  showLineNumbers = true,
}: SyntaxHighlighterProps) {
  const [copied, setCopied] = React.useState(false);
  const [isWrapped, setIsWrapped] = React.useState(false);
  const { theme } = useTheme();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Normalize language for Prism (e.g., 'vue' -> 'javascript' fallback if needed)
  const normalizedLang = language?.toLowerCase() || "text";

  return (
    <div
      className={cn(
        "group relative my-4 overflow-hidden rounded-lg border border-border bg-muted/30 dark:bg-[#0d1117]",
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 dark:bg-[#161b22] px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4" />
          <span className="font-mono">
            {fileName || `${normalizedLang} snippet`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Wrap Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 hover:bg-white/10",
              isWrapped && "bg-white/10 text-zinc-100"
            )}
            onClick={() => setIsWrapped(!isWrapped)}
            title="Toggle text wrap"
          >
            <WrapText className="h-3.5 w-3.5" />
          </Button>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-white/10"
            onClick={copyToClipboard}
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Code Area */}
      <div className="relative">
        <SyntaxHighlighterPrism
          language={normalizedLang}
          style={theme === 'dark' ? oneDark : prism}
          showLineNumbers={showLineNumbers}
          wrapLines={isWrapped}
          wrapLongLines={isWrapped}
          customStyle={{
            margin: 0,
            padding: "1.5rem 1rem",
            fontSize: "0.875rem", // text-sm
            lineHeight: "1.5rem",
            backgroundColor: "transparent", // Use container bg
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono), monospace",
            },
          }}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "#6e7681",
            textAlign: "right",
          }}
        >
          {code}
        </SyntaxHighlighterPrism>
      </div>
    </div>
  );
}
