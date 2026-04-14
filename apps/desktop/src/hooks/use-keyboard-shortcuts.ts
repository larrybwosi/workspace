import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useWorkspaces } from '@repo/api-client';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { data: workspaces } = useWorkspaces();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod) {
        // Workspace switching: Cmd/Ctrl + [1-9]
        if (e.key >= '1' && e.key <= '9') {
          const index = parseInt(e.key) - 1;
          if (workspaces && workspaces[index]) {
            e.preventDefault();
            navigate(`/workspace/${workspaces[index].slug}`);
          }
        }

        // Navigation shortcuts: Cmd/Ctrl + Shift + ...
        if (e.shiftKey) {
          if (e.key.toLowerCase() === 'd') {
            e.preventDefault();
            navigate('/friends'); // Usually the entry point for DMs
          }
          if (e.key.toLowerCase() === 'a') {
            e.preventDefault();
            navigate('/assistant');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, workspaces]);
}
