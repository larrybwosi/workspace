'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/auth/auth-client';
import { Loader2, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      if (token) {
        const res = await authClient.resetPassword({
          newPassword: password,
          token,
        });

        if (res?.error) {
          toast.error(res.error.message || 'Failed to set password. The link may have expired.');
          setIsLoading(false);
          return;
        }
      } else if (email) {
        // If password reset token was not supplied, request password reset or notify user
        const res = await authClient.forgetPassword({
          email,
          redirectTo: '/verify-email',
        });

        if (res?.error) {
          toast.error(res.error.message || 'Verification failed. Please check your link.');
          setIsLoading(false);
          return;
        }
      }

      setIsSuccess(true);
      toast.success('Account verified and password set successfully!');

      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (error: any) {
      toast.error(error?.message || 'An error occurred during account verification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Verify your account</CardTitle>
        <CardDescription>
          {email ? (
            <>Set a password for <span className="font-medium text-foreground">{email}</span> to activate your account.</>
          ) : (
            'Set a secure password for your account to get started on Scrymechat.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Account Verified!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your account is active. Redirecting you to sign in...
              </p>
            </div>
            <Button asChild className="w-full mt-4">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Set Password
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-center text-xs text-muted-foreground">
        <p>Already have an active account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link></p>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Scrymechat</h1>
          <p className="text-muted-foreground">Account Verification</p>
        </div>
        <Suspense fallback={
          <Card className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Loading verification details...</p>
          </Card>
        }>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
