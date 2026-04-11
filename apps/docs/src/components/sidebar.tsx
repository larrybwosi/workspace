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
        { href: '/api-reference/workspaces', label: 'Workspaces & Members', category: 'Resources' },
        { href: '/api-reference/messages', label: 'Messages & Channels', category: 'Resources' },
        { href: '/api-reference/webhooks', label: 'Webhooks', category: 'Resources' },
        { href: '/api-reference/recipe-bot', label: 'How to build a bot', category: 'Recipes' },
        { href: '/api-reference/recipe-sync-members', label: 'Syncing members', category: 'Recipes' },
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
    <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
      <div className="h-full py-6 pr-6 lg:py-8 overflow-y-auto scrollbar-hide">
        <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-foreground/70">
          {isUserGuide ? 'User Guide' : 'API Reference'}
        </h4>
        <div className="flex flex-col gap-6 mt-4">
          {Object.entries(groupedLinks).map(([category, items]) => (
            <div key={category} className="space-y-1">
              {!isUserGuide && (
                <h5 className="mb-2 px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {category}
                </h5>
              )}
              <div className="flex flex-col gap-0.5">
                {items.map(link => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        'group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 text-sm transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {link.label}
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
