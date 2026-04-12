import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { cn } from '@repo/ui/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { authClient } from '@repo/shared/auth/client';

export function DeveloperLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigation = [
    { name: 'Applications', href: '/developer', icon: 'apps' },
    { name: 'Documentation', href: '#', icon: 'description' },
    { name: 'Teams', href: '/developer/teams', icon: 'groups' },
    { name: 'Settings', href: '/developer/settings', icon: 'settings' },
  ];

  const handleLogout = async () => {
    await authClient.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/10">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full flex flex-col py-8 bg-surface-container-low dark:bg-[#1a182b] w-64 border-r border-outline-variant/10 z-50">
        <div className="px-8 mb-12">
          <Link to="/" className="block">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface dark:text-white">Skryme</h1>
            <p className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase mt-1 opacity-70">
              Developer Portal
            </p>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map(item => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/developer' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-300 group',
                  isActive
                    ? 'text-primary font-bold bg-surface-container-lowest shadow-sm translate-x-1'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/50'
                )}
              >
                <span className="material-symbols-outlined text-xl" data-icon={item.icon}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 mt-auto pt-8 border-t border-outline-variant/10">
          <Link
            to="#"
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-xl" data-icon="help">
              help
            </span>
            <span className="text-sm font-medium">Support</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-xl" data-icon="logout">
              logout
            </span>
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* TopAppBar */}
      <header className="fixed top-0 right-0 left-64 h-16 flex justify-between items-center px-8 z-40 bg-surface/80 dark:bg-[#1a182b]/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              search
            </span>
            <input
              className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-primary/40 transition-all w-64 placeholder:text-outline/60"
              placeholder="Search resources..."
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">help</span>
          </button>

          <div className="h-8 w-px bg-outline-variant/30 mx-2"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-on-surface">{user?.name}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Developer</p>
            </div>
            {user?.image ? (
              <img
                alt="User Profile"
                className="w-8 h-8 rounded-full border-2 border-primary-container object-cover"
                src={user.image}
              />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-primary-container bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 pt-24 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
