import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { apiClient } from '@repo/api-client';
import { authClient } from '../../lib/auth/auth-client';
import { Loader2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { realtime } from '@repo/shared';

type Status = 'loading' | 'pending' | 'authorized' | 'expired' | 'denied' | 'error';

export function QRCodeLoginPage() {
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const navigate = useNavigate();
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef(5);

  const clearPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const initQR = useCallback(async () => {
    clearPolling();
    setStatus('loading');
    setDeviceCode(null);
    setUserCode(null);
    setQrValue(null);

    try {
      const { data } = await apiClient.post('/device-auth/qr/generate');
      setDeviceCode(data.deviceCode);
      setUserCode(data.userCode);
      // Prefer the pre-filled verification URL so scanning the code takes
      // the user straight to the approval screen with the code applied.
      setQrValue(data.verificationUriComplete ?? data.verificationUri);
      intervalRef.current = data.interval ?? 5;
      setStatus('pending');
    } catch (e) {
      console.error('Failed to generate QR', e);
      toast.error('Failed to initialize QR login');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    initQR();
    return () => clearPolling();
  }, [initQR]);

  const handleAuthorization = useCallback(
    async (token: string) => {
      clearPolling();
      setStatus('authorized');

      try {
        // Populate all token keys in localStorage to ensure Better-Auth and API clients recognize session
        localStorage.setItem('better-auth.session_token', token);
        localStorage.setItem('better-auth.session-token', token);
        localStorage.setItem('bearer_token', token);

        await authClient.getSession();

        toast.success('Logged in successfully!');
        navigate('/');
      } catch (error) {
        console.error('Failed to finalize login', error);
        toast.error('Failed to finalize login');
        setStatus('pending');
      }
    },
    [navigate]
  );

  const checkStatus = useCallback(async () => {
    if (!deviceCode) return;
    try {
      const { data } = await apiClient.get(`/device-auth/qr/status/${deviceCode}`);

      switch (data.status) {
        case 'authorized':
          if (data.token) {
            await handleAuthorization(data.token);
          }
          return;
        case 'expired':
          clearPolling();
          setStatus('expired');
          return;
        case 'denied':
          clearPolling();
          setStatus('denied');
          return;
        case 'pending':
          if (data.slowDown) {
            intervalRef.current += 5;
          }
          break;
      }
    } catch (e) {
      console.error('Status check failed', e);
    }
  }, [deviceCode, handleAuthorization]);

  useEffect(() => {
    if (!deviceCode || !userCode || status !== 'pending') return;

    // Real-time channel listener for instant authorization
    const channel = `qr-session:${userCode}`;

    const handleRealtimeEvent = async (payload: any) => {
      if (payload?.status === 'authorized') {
        if (payload.token) {
          await handleAuthorization(payload.token);
        } else {
          await checkStatus();
        }
      } else if (payload?.status === 'denied') {
        clearPolling();
        setStatus('denied');
      }
    };

    realtime.subscribe(channel, 'authorized', handleRealtimeEvent);
    realtime.subscribe(channel, 'denied', handleRealtimeEvent);

    const poll = async () => {
      await checkStatus();
      if (status === 'pending') {
        pollingRef.current = setTimeout(poll, intervalRef.current * 1000);
      }
    };

    pollingRef.current = setTimeout(poll, intervalRef.current * 1000);

    return () => {
      clearPolling();
      realtime.unsubscribe(channel, 'authorized', handleRealtimeEvent);
      realtime.unsubscribe(channel, 'denied', handleRealtimeEvent);
    };
  }, [deviceCode, userCode, status, checkStatus, handleAuthorization]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-primary/10 p-4">
            <QrCode className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">Login with QR Code</h2>
          <p className="mt-2 text-muted-foreground">Scan this code with your mobile app to log in instantly.</p>
        </div>

        <div className="flex aspect-square w-full items-center justify-center rounded-xl border bg-card p-8">
          {status === 'pending' && qrValue ? (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-lg shadow-inner">
                <QRCodeSVG value={qrValue} size={256} level="H" marginSize={1} />
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded tracking-widest">
                {userCode}
              </p>
            </div>
          ) : status === 'expired' ? (
            <div className="text-center">
              <p className="text-destructive mb-4">QR Code expired</p>
              <button
                onClick={initQR}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Refresh QR Code
              </button>
            </div>
          ) : status === 'denied' ? (
            <div className="text-center">
              <p className="text-destructive mb-4">Login request was denied</p>
              <button
                onClick={initQR}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          ) : status === 'authorized' ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Finishing login...</p>
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
              <p className="text-destructive mb-4">Couldn't start QR login</p>
              <button
                onClick={initQR}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
        </div>

        <button
          onClick={() => navigate('/login')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to standard login
        </button>
      </div>
    </div>
  );
}
