'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { realtime } from '@repo/shared';

interface QRLoginProps {
  inviteToken?: string | null;
}

export function QRLogin({ inviteToken }: QRLoginProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'authorized' | 'expired'>('pending');

  const generateQR = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/device-auth/qr/generate', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to generate QR code');
      const data = await response.json();
      setSessionId(data.sessionId);
      setStatus('pending');
    } catch (err) {
      setError('Could not load QR code. Please try again.');
      toast.error('Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  useEffect(() => {
    if (!sessionId) return;

    const channel = `qr-session:${sessionId}`;

    const handleAuthorized = (payload: any) => {
      if (payload.status === 'authorized' && payload.token) {
        setStatus('authorized');

        // Better Auth uses 'better-auth.session_token' cookie
        // We set it as a session cookie, but ideally the backend should set this via a secure HttpOnly cookie
        // For now, this matches the mobile-to-web handoff logic
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
        document.cookie = `better-auth.session_token=${payload.token}; path=/; max-age=31536000; SameSite=Lax${isSecure ? '; Secure' : ''}`;

        toast.success('Successfully logged in via QR code!');

        const callbackURL = inviteToken ? `/invite/${inviteToken}` : '/';
        router.push(callbackURL);
      }
    };

    realtime.subscribe(channel, 'authorized', handleAuthorized);

    // Also poll as a fallback every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/device-auth/qr/status/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'authorized') {
            handleAuthorized(data);
          } else if (data.status === 'expired') {
            setStatus('expired');
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error checking QR status', err);
      }
    }, 5000);

    return () => {
      realtime.unsubscribe(channel, 'authorized', handleAuthorized);
      clearInterval(interval);
    };
  }, [sessionId, inviteToken, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 border rounded-xl bg-muted/30">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating secure QR code...</p>
      </div>
    );
  }

  if (error || status === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 border rounded-xl bg-muted/30">
        <p className="text-sm text-destructive font-medium">{error || 'QR code expired'}</p>
        <Button onClick={generateQR} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh QR Code
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 border rounded-xl bg-white dark:bg-zinc-950 shadow-sm">
      <div className="relative p-4 bg-white rounded-lg">
        {sessionId ? (
          <QRCodeSVG
            value={`scrymechat:${sessionId}`}
            size={200}
            level="H"
            includeMargin={false}
          />
        ) : (
          <div className="w-[200px] h-[200px] flex items-center justify-center bg-muted">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {status === 'authorized' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-zinc-950/90 rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold">Authorized!</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-foreground font-medium">
          <Smartphone className="w-4 h-4" />
          <span>Log in with QR Code</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
          Scan this code with your mobile app to log in instantly.
        </p>
      </div>
    </div>
  );
}
