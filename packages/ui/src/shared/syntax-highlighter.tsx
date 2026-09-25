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
        'group relative my-2 inline-block w-fit max-w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30 dark:bg-[#0d1117] shadow-sm transition-all hover:border-border',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/50 bg-muted/60 dark:bg-[#161b22] px-3.5 py-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="h-3.5 w-3.5 text-primary/80 shrink-0" />
          <span className="font-mono text-[11px] font-medium truncate">{fileName || `${normalizedLang}`}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Wrap Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-5 w-5 hover:bg-muted-foreground/10 text-muted-foreground rounded', isWrapped && 'bg-primary/10 text-primary')}
            onClick={() => setIsWrapped(!isWrapped)}
            title="Toggle text wrap"
          >
            <WrapText className="h-3 w-3" />
          </Button>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-muted-foreground/10 text-muted-foreground rounded"
            onClick={copyToClipboard}
            title="Copy code"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Code Area */}
      <div className="relative overflow-x-auto max-w-full">
        <SyntaxHighlighterPrism
          language={normalizedLang}
          style={theme === 'dark' ? oneDark : prism}
          showLineNumbers={showLineNumbers}
          wrapLines={isWrapped}
          wrapLongLines={isWrapped}
          customStyle={{
            margin: 0,
            padding: '0.875rem 1.125rem',
            fontSize: '0.8125rem', // 13px
            lineHeight: '1.375rem',
            backgroundColor: 'transparent',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-mono), monospace',
            },
          }}
          lineNumberStyle={{
            minWidth: '2.2em',
            paddingRight: '0.8em',
            color: '#6e7681',
            textAlign: 'right',
            userSelect: 'none',
          }}
        >
          {code}
        </SyntaxHighlighterPrism>
      </div>
    </div>
  );
}
