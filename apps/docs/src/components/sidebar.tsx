import Link from 'next/link';

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
        { href: '/api-reference/authentication', label: 'Authentication' },
        { href: '/api-reference/workspaces', label: 'Workspaces' },
        { href: '/api-reference/messages', label: 'Messages' },
        { href: '/api-reference/webhooks', label: 'Webhooks' },
      ];

  return (
    <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
      <div className="h-full py-6 pr-6 lg:py-8">
        <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
          {isUserGuide ? 'User Guide' : 'API Reference'}
        </h4>
        <div className="grid grid-flow-row auto-rows-max text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
