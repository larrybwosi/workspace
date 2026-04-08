import * as React from 'react';
import { BarChart3, Users, Sparkles, Activity, Shield, Settings } from 'lucide-react';
import { Button } from '../components/button';
import { cn } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Overview', icon: BarChart3, href: '/' },
  { label: 'Members', icon: Users, href: '/members' },
  { label: 'Assets', icon: Sparkles, href: '/assets' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Activity', icon: Activity, href: '/activity' },
  { label: 'Security', icon: Shield, href: '/security' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border',
          'transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Admin Panel
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 h-10 px-3 font-medium transition-all',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
                onClick={() => handleNavigate(item.href)}
              >
                <item.icon className={cn('h-5 w-5', isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground')} />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">Dealio v0.1.0 Admin</p>
        </div>
      </aside>
    </>
  );
}
