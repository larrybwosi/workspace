import { Link, useLocation } from 'react-router';
import { cn } from '@repo/ui';

export function Sidebar({ type }: { type: 'user-guide' | 'api-reference' }) {
  const isUserGuide = type === 'user-guide';
  const location = useLocation();

  const links = isUserGuide
    ? [
        { href: '/user-guide/joining-workspace', label: 'Joining a Workspace', category: 'Getting Started' },
        { href: '/user-guide/sending-messages', label: 'Sending Messages', category: 'Basics' },
        { href: '/user-guide/custom-messages', label: 'Custom Messages', category: 'Basics' },
        { href: '/user-guide/making-calls', label: 'Making Calls', category: 'Advanced' },
        { href: '/user-guide/inviting-members', label: 'Inviting Members', category: 'Advanced' },
        { href: '/user-guide/applications', label: 'Applications', category: 'Integrations' },
        { href: '/user-guide/m2m-integration', label: 'M2M Integration', category: 'Integrations' },
        { href: '/user-guide/bot-provisioning', label: 'Bot Provisioning', category: 'Integrations' },
        { href: '/user-guide/mcp', label: 'Model Context Protocol', category: 'Integrations' },
      ]
    : [
        { href: '/api-reference/explorer', label: 'Interactive API Explorer', category: 'General' },
        { href: '/api-reference/authentication', label: 'V3 Authentication', category: 'Resources' },
        { href: '/api-reference/applications', label: 'V3 Applications & Bots', category: 'Resources' },
        { href: '/api-reference/workspaces', label: 'V3 Workspaces & Members', category: 'Resources' },
        { href: '/api-reference/webhooks', label: 'V3 Webhooks', category: 'Resources' },
        { href: '/api-reference/incoming-webhooks', label: 'V3 Channel Incoming Webhooks', category: 'Resources' },
        { href: '/api-reference/recipe-bot', label: 'Building a Bot Recipe', category: 'Guides' },
        { href: '/api-reference/discord-v10', label: 'Discord V10 Gateway', category: 'Guides' },
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
          {isUserGuide ? 'User Guide' : 'API V3 Reference'}
        </h4>
        <div className="flex flex-col gap-8">
          {Object.entries(groupedLinks).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h5 className="px-3 text-[11px] font-bold text-foreground/70 uppercase tracking-widest">{category}</h5>
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
