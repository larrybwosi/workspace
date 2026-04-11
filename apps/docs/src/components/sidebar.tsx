import { Link } from 'react-router-dom';

export function Sidebar({ type }: { type: 'user-guide' | 'api-reference' }) {
  const isUserGuide = type === 'user-guide';

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

  const groupedLinks = links.reduce((acc, link) => {
    const category = (link as any).category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(link);
    return acc;
  }, {} as Record<string, typeof links>);

  return (
    <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
      <div className="h-full py-6 pr-6 lg:py-8 overflow-y-auto">
        <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-bold uppercase tracking-wider text-foreground">
          {isUserGuide ? 'User Guide' : 'API Reference'}
        </h4>
        <div className="grid grid-flow-row auto-rows-max text-sm gap-4 mt-4">
          {Object.entries(groupedLinks).map(([category, items]) => (
            <div key={category}>
              {!isUserGuide && <h5 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase">{category}</h5>}
              <div className="grid grid-flow-row auto-rows-max gap-1">
                {items.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
