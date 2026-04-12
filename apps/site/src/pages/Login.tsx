import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { authClient } from '@repo/shared/auth/client';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { useAuth } from '@/hooks/use-auth';
import { Layout } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const callbackUrl = searchParams.get('callbackUrl') || '/developer';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(callbackUrl, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, callbackUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: callbackUrl,
        },
        {
          onSuccess: () => {
            navigate(callbackUrl, { replace: true });
          },
          onError: ctx => {
            console.log(ctx.error);
            setError(ctx.error.message || 'Failed to login');
          },
        }
      );
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md space-y-8 bg-surface-container-lowest p-8 rounded-2xl shadow-xl border border-outline-variant/10">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Layout className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">Skryme</span>
          </Link>
          <h2 className="text-3xl font-extrabold text-on-surface">Welcome back</h2>
          <p className="mt-2 text-on-surface-variant">Log in to your developer account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 bg-error-container text-on-error-container text-sm rounded-lg border border-error/20">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface-variant">Email address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-on-surface-variant">Password</label>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl font-bold" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <a href={`${import.meta.env.VITE_WEB_URL}/signup`} className="text-primary font-bold hover:underline">
              Sign up on Web
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
