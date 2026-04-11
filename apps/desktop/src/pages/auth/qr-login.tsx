import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@repo/api-client";
import { saveAuthToken } from "../../lib/auth/secure-store";
import { Loader2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function QRCodeLoginPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const navigate = useNavigate();

  useEffect(() => {
    async function initQR() {
      try {
        const { data } = await apiClient.post("/auth/device/qr/generate");
        setSessionId(data.sessionId);
      } catch (e) {
        console.error("Failed to generate QR", e);
      }
    }
    initQR();
  }, []);

  useEffect(() => {
    if (!sessionId || status === "authorized") return;

    const interval = setInterval(async () => {
      try {
        const { data } = await apiClient.get(`/auth/device/qr/status/${sessionId}`);
        if (data.status === "authorized") {
          setStatus("authorized");
          await saveAuthToken(data.token);
          navigate("/");
        } else if (data.status === "expired") {
          setStatus("expired");
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Status check failed", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, status, navigate]);

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
          <p className="mt-2 text-muted-foreground">
            Scan this code with your mobile app to log in instantly.
          </p>
        </div>

        <div className="flex aspect-square w-full items-center justify-center rounded-xl border bg-card p-8">
          {status === "pending" && sessionId ? (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-lg shadow-inner">
                <QRCodeSVG
                  value={`workspace-auth:${sessionId}`}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                {sessionId}
              </p>
            </div>
          ) : status === "expired" ? (
            <div className="text-center">
              <p className="text-destructive">QR Code expired</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Refresh
              </button>
            </div>
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to standard login
        </button>
      </div>
    </div>
  );
}
