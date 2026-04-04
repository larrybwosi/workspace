'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

interface LinkPreviewData {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
  url: string;
}

export function LinkPreview({ url }: { url: string }) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data.title || data.description || data.image) {
          setPreview(data);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Discord-style loading skeleton
  if (loading) {
    return (
      <div className="mt-2 max-w-lg border-l-4 border-muted bg-muted/20 rounded-md p-4 flex gap-4 animate-pulse">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-5/6 bg-muted rounded" />
        </div>
        <div className="w-20 h-20 shrink-0 bg-muted rounded-md" />
      </div>
    );
  }

  if (error || !preview) {
    // Fallback if fetch fails, just display the raw clickable link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline text-sm break-all"
      >
        {url}
      </a>
    );
  }

  return (
    <div className="group relative mt-2 max-w-lg rounded-r-md rounded-l-sm border-l-4 border-l-gray-400 dark:border-l-gray-600 bg-[#f2f3f5] dark:bg-[#2b2d31] flex flex-col sm:flex-row overflow-hidden shadow-sm transition-all hover:shadow-md">
      {/* Discord-style Hover Action Menu */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border dark:border-zinc-700 shadow-sm rounded-md p-1 z-10">
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          title="Copy Link"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          title="Open Link"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="p-4 flex-1 min-w-0 flex flex-col justify-center">
        {preview.siteName && (
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block truncate">
            {preview.siteName}
          </span>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-semibold text-blue-600 dark:text-blue-400 hover:underline block truncate mb-1"
        >
          {preview.title || url}
        </a>

        {preview.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed mt-1">
            {preview.description}
          </p>
        )}
      </div>

      {preview.image && (
        <div className="shrink-0 p-4 pl-0 hidden sm:block">
          <div className="w-24 h-24 rounded-md overflow-hidden relative bg-zinc-200 dark:bg-zinc-800 border border-black/5 dark:border-white/5">
            <img
              src={preview.image}
              alt={preview.title || 'Preview image'}
              className="w-full h-full object-cover transition-transform hover:scale-105"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          </div>
        </div>
      )}

      {/* Mobile Image Fallback (Shows below text on small screens) */}
      {preview.image && (
        <div className="shrink-0 w-full h-48 sm:hidden border-t border-black/5 dark:border-white/5">
          <img
            src={preview.image}
            alt={preview.title || 'Preview image'}
            className="w-full h-full object-cover"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}
    </div>
  );
}
