import { Link, useLocation } from 'react-router';
import { cn } from '@repo/ui';

export function Sidebar({ type }: { type: 'user-guide' | 'api-reference' }) {
  const isUserGuide = type === 'user-guide';
  const location = useLocation();

  const links = isUserGuide
    ? [
        { href: '/user-guide/joining-workspace', label: 'Joining a Workspace' },
        { href: '/user-guide/sending-messages', label: 'Sending Messages' },
        { href: '/user-guide/making-calls', label: 'Making Calls' },
        { href: '/user-guide/inviting-members', label: 'Inviting Members' },
      ]
    : [
        { href: '/api-reference/getting-started', label: 'Getting Started', category: 'General' },
        { href: '/api-reference/authentication', label: 'Authentication', category: 'General' },
        { href: '/api-reference/errors', label: 'Errors & Rate Limits', category: 'General' },
        { href: '/api-reference/workspaces', label: 'Workspaces & Members', category: 'Resources' },
        { href: '/api-reference/messages', label: 'Messages & Channels', category: 'Resources' },
        { href: '/api-reference/real-time', label: 'Real-time Events', category: 'Resources' },
        { href: '/api-reference/webhooks', label: 'Webhooks', category: 'Resources' },
        { href: '/api-reference/recipe-bot', label: 'How to build a bot', category: 'Recipes' },
        { href: '/api-reference/recipe-sync-members', label: 'Syncing members', category: 'Recipes' },
        { href: '/api-reference/recipe-slash-commands', label: 'Slash commands', category: 'Recipes' },
        { href: '/api-reference/recipe-file-uploads', label: 'File uploads', category: 'Recipes' },
      ];

  const groupedLinks = links.reduce(
    (acc, link) => {
      const category = (link as any).category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(link as any);
      return acc;
    },
    {} as Record<string, any[]>
  );

  return (
    <aside className="w-full h-full">
      <div className="py-6 lg:py-8 pr-4 overflow-y-auto h-full scrollbar-hide">
        <h4 className="mb-4 px-3 text-xs font-bold uppercase tracking-widest text-foreground/40">
          {isUserGuide ? 'User Guide' : 'API Reference'}
        </h4>
        <div className="flex flex-col gap-8">
          {Object.entries(groupedLinks).map(([category, items]) => (
            <div key={category} className="space-y-3">
              {!isUserGuide && (
                <h5 className="px-3 text-[11px] font-bold text-foreground/70 uppercase tracking-widest">
                  {category}
                </h5>
              )}
              <div className="flex flex-col space-y-0.5">
                {items.map(link => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        'group flex w-full items-center rounded-md px-3 py-1.5 text-sm transition-all duration-200 relative',
                        isActive
                          ? 'text-primary font-semibold bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:translate-x-1'
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 w-1 h-4 bg-primary rounded-full -translate-x-0.5 transition-all duration-300" />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
