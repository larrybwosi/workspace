'use client';

import * as React from 'react';
import { Check, Copy, FileCode, WrapText } from 'lucide-react';
import { Prism as SyntaxHighlighterPrism } from 'react-syntax-highlighter';
import { oneDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '../components/button';
import { cn } from '../lib/utils';
import { useTheme } from '../layout/theme-provider';

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
  const normalizedLang = language?.toLowerCase() || 'text';

  return (
    <div
      className={cn(
        'group relative my-6 overflow-hidden rounded-xl border border-border bg-muted/20 dark:bg-zinc-950/50 shadow-sm',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 dark:bg-zinc-900/50 px-4 py-2.5 text-xs text-muted-foreground backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5 mr-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/20 dark:bg-red-500/10 border border-red-500/30" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/20 dark:bg-amber-500/10 border border-amber-500/30" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 border border-emerald-500/30" />
          </div>
          <FileCode className="h-3.5 w-3.5 opacity-70" />
          <span className="font-medium tracking-tight uppercase text-[10px] opacity-70">
            {fileName || normalizedLang}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Wrap Toggle */}
          <button
            className={cn(
              'h-7 px-2 flex items-center gap-1.5 rounded-md hover:bg-zinc-500/10 text-muted-foreground transition-colors',
              isWrapped && 'text-primary bg-primary/10 hover:bg-primary/20'
            )}
            onClick={() => setIsWrapped(!isWrapped)}
            title="Toggle text wrap"
          >
            <WrapText className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Wrap</span>
          </button>

          {/* Copy Button */}
          <button
            className="h-7 px-2 flex items-center gap-1.5 rounded-md hover:bg-zinc-500/10 text-muted-foreground transition-colors"
            onClick={copyToClipboard}
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Copy</span>
              </>
            )}
          </button>
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
            padding: '1.25rem 1rem',
            fontSize: '13px',
            lineHeight: '1.6',
            backgroundColor: 'transparent', // Use container bg
            fontFamily: 'var(--font-mono)',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-mono), monospace',
            },
          }}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#6e7681',
            textAlign: 'right',
          }}
        >
          {code}
        </SyntaxHighlighterPrism>
      </div>
    </div>
  );
}
