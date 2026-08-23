'use client';

import { FileIcon, ExternalLink } from 'lucide-react';
import type { Attachment } from '../../../lib/types';
import { cn } from '../../../lib/utils';
import { getDocumentIconPath } from '@repo/shared';
import { CallInviteMessage } from './call-invite-message';

interface MessageAttachmentsProps {
  attachments?: Attachment[];
  message?: any;
}

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'tiff', 'ico'];

export function MessageAttachments({ attachments, message }: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-2 grid gap-2 grid-cols-1 sm:grid-cols-2 max-w-lg">
      {attachments.map((attachment, index) => {
        if (attachment.type === 'call-invite') {
          return (
            <div key={attachment.id || index} className="col-span-full">
              <CallInviteMessage
                message={message || (attachment as any).message || { sender: { name: 'Someone' } }}
                attachment={attachment}
              />
            </div>
          );
        }

        const extension = attachment.name?.split('.').pop()?.toLowerCase() || '';
        const isImage =
          attachment.type?.startsWith('image/') ||
          IMAGE_EXTENSIONS.includes(extension);

        // 1. Image Rendering Logic
        if (isImage && attachment.url) {
          const isSanityImage = attachment.url.includes('cdn.sanity.io');
          const querySymbol = attachment.url.includes('?') ? '&' : '?';
          const imageUrl = isSanityImage ? `${attachment.url}${querySymbol}fm=webp` : attachment.url;

          return (
            <a
              key={attachment.id || index}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'group relative overflow-hidden rounded-xl border border-border/60 bg-muted/20',
                'hover:border-primary/50 transition-all duration-200 cursor-pointer',
                'max-h-72 w-full flex items-center justify-center'
              )}
            >
              <img
                src={imageUrl}
                alt={attachment.name || 'Attached image'}
                className="w-full max-h-72 object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 p-2 text-center backdrop-blur-[2px]">
                <ExternalLink className="h-4 w-4" />
                <span className="truncate">{attachment.name}</span>
              </div>
            </a>
          );
        }

        // 2. Document & File Rendering Logic
        const iconPath = getDocumentIconPath(attachment.name || attachment.type || '');

        return (
          <a
            key={attachment.id || index}
            href={attachment.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'group flex items-center gap-3 p-2.5 border border-border/60 rounded-xl bg-card/80 hover:bg-accent/50',
              'transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md'
            )}
          >
            {/* Document / File Icon Rendering */}
            <div className="h-10 w-10 shrink-0 rounded-lg bg-muted/50 flex items-center justify-center border border-border/40 overflow-hidden">
              <img
                src={iconPath}
                alt={attachment.name || 'Document'}
                className="h-6 w-6 object-contain"
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Fallback Lucide Icon */}
              <FileIcon className="h-5 w-5 text-muted-foreground hidden" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                {attachment.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {attachment.size && <span>{attachment.size}</span>}
                {extension && <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/60">{extension}</span>}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
