import { Link } from 'react-router';
import { useAuth } from '@/hooks/use-auth';

const NAV_LINKS = [
  { label: 'Product', to: '/' },
  { label: 'Workspaces', to: '/workspaces' },
  { label: 'Integrations', to: '/integrations' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Developers', to: '/developers' },
];

const Header = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center w-full px-10 py-0 h-14 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-10">
          <Link to="/" className="text-[15px] font-medium tracking-tight text-slate-900 dark:text-white">
            Skryme
          </Link>
          <div className="hidden md:flex gap-7">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-[13px] text-slate-500 dark:text-slate-400 hidden sm:block">Hi, {user?.name}</span>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-medium rounded cursor-pointer hover:opacity-85 transition-opacity"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-medium rounded cursor-pointer hover:opacity-85 transition-opacity"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
