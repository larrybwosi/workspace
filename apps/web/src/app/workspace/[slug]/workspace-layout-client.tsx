'use client';

import { useParams } from 'next/navigation';
import { useWorkspace } from '@repo/api-client';
import { useBranding, CommandPaletteProvider } from '@repo/ui';

export default function WorkspaceLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: workspace } = useWorkspace(slug);

  useBranding(workspace?.brandingConfig);

  return (
    <CommandPaletteProvider workspaceSlug={slug} workspaceName={workspace?.name}>
      {children}
    </CommandPaletteProvider>
  );
}
