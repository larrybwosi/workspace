import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from '@repo/ui';
import { signIn } from '../lib/auth/auth-client';
import { Loader2, Mail, Lock, QrCode, Settings2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { setCustomApiUrl, getCustomApiUrl } from '@repo/shared';

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState(getCustomApiUrl() || '');

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiUrl(apiUrl);
    toast.success('API URL updated. Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn.email({
        email,
        password,
      });

      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Workspace Desktop</h1>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setShowApiSettings(!showApiSettings)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Enter your email to sign in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showApiSettings && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30 mb-4">
                <form onSubmit={handleSaveApiUrl} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl" className="text-xs uppercase font-bold text-muted-foreground">
                      Custom API URL
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="apiUrl"
                        type="url"
                        placeholder="https://api.example.com"
                        value={apiUrl}
                        onChange={e => setApiUrl(e.target.value)}
                        className="pl-10 h-9"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Leave empty to use default Scrymechat API.</p>
                  </div>
                  <Button type="submit" size="sm" className="w-full h-8">
                    Save and Reload
                  </Button>
                </form>
                <Separator />
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={() => navigate('/login/qr')}
              disabled={isLoading}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Sign in with QR Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
