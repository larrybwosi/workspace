'use client';

import * as React from 'react';
import { Home, MessageSquare, Bell, User, Users } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { haptic } from '../lib/haptics';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  activePaths: string[];
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: 'Home',
      href: '/',
      activePaths: ['/', '/workspace'],
    },
    {
      icon: MessageSquare,
      label: 'DMs',
      href: '/dm',
      activePaths: ['/dm'],
    },
    {
      icon: Users,
      label: 'Friends',
      href: '/friends',
      activePaths: ['/friends'],
    },
    {
      icon: Bell,
      label: 'Activity',
      href: '/notifications',
      activePaths: ['/notifications'],
    },
  ];

  const isActive = (item: NavItem) => {
    return item.activePaths.some((path) =>
      path === '/' ? pathname === '/' : pathname.startsWith(path)
    );
  };

  const handleNavigate = (href: string) => {
    haptic.light();
    router.push(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.href)}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'fill-current')} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
