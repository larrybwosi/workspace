import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { apiClient } from '@repo/api-client';
import { authClient } from '../../lib/auth/auth-client';
import { Loader2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

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
        // Better-Auth reads the session token from localStorage on this
        // client; swap in the access token issued by the device flow.
        localStorage.setItem('better-auth.session-token', token);
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

  useEffect(() => {
    if (!deviceCode || status !== 'pending') return;

    const poll = async () => {
      try {
        const { data } = await apiClient.get(`/device-auth/qr/status/${deviceCode}`);

        switch (data.status) {
          case 'authorized':
            await handleAuthorization(data.token);
            return;
          case 'expired':
            setStatus('expired');
            return;
          case 'denied':
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

      pollingRef.current = setTimeout(poll, intervalRef.current * 1000);
    };

    pollingRef.current = setTimeout(poll, intervalRef.current * 1000);

    return () => clearPolling();
  }, [deviceCode, status, handleAuthorization]);

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
