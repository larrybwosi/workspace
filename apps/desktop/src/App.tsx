import { WebProviders } from "@repo/ui";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { QRCodeLoginPage } from "./pages/auth/qr-login";
import { ChatPage } from "./pages/chat";
import { DMPage } from "./pages/dm";
import { FriendsPage } from "./pages/friends";
import { AssistantPage } from "./pages/assistant";
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

import { DesktopTitleBar } from "./components/layout/desktop-title-bar";

function App() {
  return (
    <WebProviders>
      <div className="flex flex-col h-screen overflow-hidden">
        <DesktopTitleBar />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/qr" element={<QRCodeLoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

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
          <Route
            path="/workspace/:slug/assistant"
            element={
              <ProtectedRoute>
                <AssistantPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dm/:userId"
            element={
              <ProtectedRoute>
                <DMPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <FriendsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute>
                <AssistantPage />
              </ProtectedRoute>
            }
          />
          </Routes>
        </Router>
      </div>
    </WebProviders>
  );
}

export default App;
