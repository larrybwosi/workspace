"use client";

import * as React from "react";
import { Check, Copy, FileCode, WrapText } from "lucide-react";
import { createHighlighter, type Highlighter } from "shiki";
import { Button } from "../components/button";
import { cn } from "../lib/utils";
import { useTheme } from "../layout/theme-provider";

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  fileName?: string;
  className?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

// Singleton highlighter instance to avoid re-creation
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [
        "typescript",
        "javascript",
        "tsx",
        "jsx",
        "bash",
        "shell",
        "json",
        "html",
        "css",
        "scss",
        "python",
        "go",
        "rust",
        "java",
        "cpp",
        "csharp",
        "ruby",
        "php",
        "sql",
        "yaml",
        "markdown",
        "text",
      ],
    });
  }
  return highlighterPromise;
}

export function SyntaxHighlighter({
  code,
  language,
  fileName,
  className,
  showLineNumbers = true,
  highlightLines = [],
}: SyntaxHighlighterProps) {
  const [copied, setCopied] = React.useState(false);
  const [isWrapped, setIsWrapped] = React.useState(false);
  const [html, setHtml] = React.useState<string>("");
  const { theme } = useTheme();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizedLang = language?.toLowerCase() || "text";
  const currentTheme = theme === "dark" ? "github-dark" : "github-light";

  React.useEffect(() => {
    let isMounted = true;

    async function highlight() {
      const highlighter = await getHighlighter();

      // Ensure the language is loaded
      if (!highlighter.getLoadedLanguages().includes(normalizedLang as any) && normalizedLang !== 'text') {
        try {
          await highlighter.loadLanguage(normalizedLang as any);
        } catch (e) {
          console.warn(`Failed to load language: ${normalizedLang}`, e);
        }
      }

      if (isMounted) {
        const generatedHtml = highlighter.codeToHtml(code, {
          lang: highlighter.getLoadedLanguages().includes(normalizedLang as any) ? normalizedLang : "text",
          theme: currentTheme,
          transformers: [
            {
              preprocess(code) {
                return code;
              },
              line(node, line) {
                if (highlightLines.includes(line)) {
                  this.addClassToHast(node, "highlighted-line");
                }
                if (showLineNumbers) {
                  node.properties["data-line"] = line;
                }
              },
            },
          ],
        });
        setHtml(generatedHtml);
      }
    }

    highlight();
    return () => {
      isMounted = false;
    };
  }, [code, normalizedLang, currentTheme, showLineNumbers, highlightLines]);

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
      <div
        className={cn(
          "relative overflow-x-auto p-4 text-sm leading-6 shiki-container",
          isWrapped ? "whitespace-pre-wrap break-all" : "whitespace-pre"
        )}
        style={{
          fontFamily: "var(--font-mono), monospace",
        }}
        dangerouslySetInnerHTML={{ __html: html || `<pre><code>${code}</code></pre>` }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .shiki-container pre {
          margin: 0;
          background-color: transparent !important;
        }
        .shiki-container code {
          counter-reset: step;
          counter-increment: step 0;
          display: block;
          min-width: max-content;
        }
        .shiki-container .line {
          display: block;
          min-height: 1.5rem;
        }
        ${showLineNumbers ? `
        .shiki-container .line::before {
          content: counter(step);
          counter-increment: step;
          width: 2rem;
          margin-right: 1.5rem;
          display: inline-block;
          text-align: right;
          color: #6e7681;
          user-select: none;
        }
        ` : ''}
        .shiki-container .highlighted-line {
          background-color: rgba(187, 187, 187, 0.1);
          margin: 0 -1rem;
          padding: 0 1rem;
        }
        .dark .shiki-container .highlighted-line {
          background-color: rgba(255, 255, 255, 0.05);
        }
      ` }} />
    </div>
  );
}
