import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { apiClient } from '@repo/api-client';
import { authClient } from '../../lib/auth/auth-client';
import { Loader2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export function QRCodeLoginPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const navigate = useNavigate();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function initQR() {
      try {
        const { data } = await apiClient.post('/auth/device/qr/generate');
        setSessionId(data.sessionId);
      } catch (e) {
        console.error('Failed to generate QR', e);
        toast.error('Failed to initialize QR login');
      }
    }
    initQR();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sessionId || status === 'authorized') return;

    // Start polling
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await apiClient.get(`/auth/device/qr/status/${sessionId}`);
        if (data.status === 'authorized') {
          handleAuthorization(data);
        } else if (data.status === 'expired') {
          setStatus('expired');
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (e) {
        console.error('Status check failed', e);
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId, status]);

  const handleAuthorization = async (data: any) => {
    if (status === 'authorized') return;
    setStatus('authorized');
    if (pollingRef.current) clearInterval(pollingRef.current);

    try {
      if (data.token) {
        // Better-Auth uses localStorage or cookies.
        // We set the token and refresh the session.
        localStorage.setItem("better-auth.session-token", data.token);
        await authClient.getSession();
      }

      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to finalize login', error);
      toast.error('Failed to finalize login');
      setStatus('pending');
    }
  };

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
          {status === 'pending' && sessionId ? (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-lg shadow-inner">
                <QRCodeSVG value={sessionId} size={256} level="H" includeMargin={true} />
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                Session ID: {sessionId}
              </p>
            </div>
          ) : status === 'expired' ? (
            <div className="text-center">
              <p className="text-destructive mb-4">QR Code expired</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Refresh QR Code
              </button>
            </div>
          ) : status === 'authorized' ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Finishing login...</p>
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
