import { WebProviders } from "@repo/ui";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { ChatPage } from "./pages/chat";
import { useSession } from "./lib/auth/auth-client";
import { Loader2 } from "lucide-react";
import { useTauri } from "./hooks/use-tauri";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  useTauri();
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <WebProviders>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:slug"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:slug/channels/:channelSlug"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </WebProviders>
  );
}

export default App;
