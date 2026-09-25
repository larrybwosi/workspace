'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { ExternalLink, Copy, Check, Globe } from 'lucide-react';

interface LinkPreviewData {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
  url: string;
}

const memoryCache = new Map<string, LinkPreviewData>();

function getCachedPreview(url: string): LinkPreviewData | null {
  if (memoryCache.has(url)) {
    return memoryCache.get(url)!;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(`lp_${url}`);
      if (stored) {
        const parsed = JSON.parse(stored) as LinkPreviewData;
        memoryCache.set(url, parsed);
        return parsed;
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  return null;
}

function setCachedPreview(url: string, data: LinkPreviewData) {
  memoryCache.set(url, data);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`lp_${url}`, JSON.stringify(data));
    } catch {
      // Ignore localStorage write quota errors
    }
  }
}

export function LinkPreview({ url }: { url: string }) {
  const cached = getCachedPreview(url);
  const [preview, setPreview] = useState<LinkPreviewData | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (cached) {
      setPreview(cached);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchPreview = async () => {
      try {
        let response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.chat.scryme.tech';
          response = await fetch(`${apiUrl}/link-preview?url=${encodeURIComponent(url)}`);
        }
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data.title || data.description || data.image) {
          setCachedPreview(url, data);
          if (isMounted) setPreview(data);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [url, cached]);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const domain = useMemo(() => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 max-w-lg rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex items-center justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-3.5 w-3/4 bg-muted rounded-md" />
            <div className="h-3 w-1/2 bg-muted rounded-md" />
          </div>
        </div>
        <div className="h-8 w-20 bg-muted rounded-xl shrink-0" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium break-all"
      >
        {url}
      </a>
    );
  }

  return (
    <div className="group relative my-2 max-w-lg rounded-2xl border border-border/70 bg-card hover:border-border/90 shadow-sm transition-all p-3.5 flex items-center justify-between gap-3">
      {/* Icon / Thumbnail + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {preview.image ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border/50 shrink-0">
            <img
              src={preview.image}
              alt={preview.title || 'Site icon'}
              className="w-full h-full object-cover"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Globe className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-semibold text-foreground hover:underline truncate block leading-snug"
          >
            {preview.title || url}
          </a>
          <span className="text-[12px] text-muted-foreground truncate block font-normal">
            {preview.siteName || domain}
          </span>
        </div>
      </div>

      {/* Quick View / Action Button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          title="Copy URL"
        >
          {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
        </button>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted/80 hover:bg-muted text-[12px] font-semibold text-foreground transition-colors border border-border/40"
        >
          Quick view
          <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
        </a>
      </div>
    </div>
  );
}
