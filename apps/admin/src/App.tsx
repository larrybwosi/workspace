import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@repo/ui/layout/theme-provider";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AdminOverviewPage } from "./pages/overview";
import { AdminAssetsPage } from "./pages/assets";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 12, // 12 hours
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AdminOverviewPage />} />
            <Route path="/assets" element={<AdminAssetsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster
          position="top-right"
          duration={4000}
          expand={true}
          richColors
          closeButton
          theme="system"
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
