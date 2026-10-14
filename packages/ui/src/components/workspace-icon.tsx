'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

interface WorkspaceIconProps {
  icon?: string | null;
  name: string;
  className?: string;
  textClassName?: string;
}

export function WorkspaceIcon({ icon, name, className, textClassName }: WorkspaceIconProps) {
  const [hasError, setHasError] = React.useState(false);

  // Reset error state if icon URL changes
  React.useEffect(() => {
    setHasError(false);
  }, [icon]);

  const initial = name ? name.charAt(0).toUpperCase() : 'W';
  const isImageUrl = icon && !hasError && (
    icon.startsWith('http://') ||
    icon.startsWith('https://') ||
    icon.startsWith('/') ||
    icon.startsWith('data:') ||
    icon.length > 3
  );

  if (isImageUrl) {
    return (
      <img
        src={icon}
        alt={name}
        className={cn('h-full w-full object-cover', className)}
        onError={() => setHasError(true)}
      />
    );
  }

  if (icon && !hasError && icon.length <= 3) {
    return <span className={cn('text-xl', textClassName)}>{icon}</span>;
  }

  return (
    <div className={cn('flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-sm select-none', className, textClassName)}>
      {initial}
    </div>
  );
}
