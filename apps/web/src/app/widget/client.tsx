"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ChannelView } from "@/components/features/chat/channel-view";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import axios from "axios";
import { apiClient } from "@repo/api-client";

// Create a specialized query client for the widget
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function WidgetClient() {
  const searchParams = useSearchParams();
  const workspaceSlug = searchParams.get("workspace");
  const channelSlug = searchParams.get("channel");
  const contextId = searchParams.get("contextId");
  const token = searchParams.get("token");
  const theme = searchParams.get("theme"); // 'light', 'dark', or 'system'
  const primaryColor = searchParams.get("primaryColor"); // e.g., #007bff

  const [resolvedChannelId, setResolvedChannelId] = useState<string | null>(null);
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState<string | null>(null);
  const [resolvedThreadId, setResolvedThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure API Client with token and V2 prefix
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // In the widget, we want to force API V2 for all requests
    // but hooks use relative paths from `/api`.
    // We can't easily change the baseURL of a shared singleton without side effects,
    // so we'll need to update the hooks to support a version prefix or
    // use a different approach.

    // For now, let's at least ensure the token is set.
  }, [token]);

  // Apply custom theming
  useEffect(() => {
    if (primaryColor) {
      // In this app, --primary is oklch. We'll try to set it as a hex for simplicity if the theme engine allows
      // or just use it as is if it's a valid CSS color.
      document.documentElement.style.setProperty("--primary", primaryColor);
      document.documentElement.style.setProperty("--ring", primaryColor);
    }

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, primaryColor]);

  // Resolve slugs to IDs using API V2
  useEffect(() => {
    async function resolveSlugs() {
      if (!workspaceSlug || !token) {
        setError("Missing required parameters: workspace and token");
        setIsLoading(false);
        return;
      }

      try {
        const authHeader = { Authorization: `Bearer ${token}` };

        // 1. Get Workspace Info
        const workspaceRes = await axios.get(`/api/v2/workspaces/${workspaceSlug}/members`, {
            headers: authHeader,
            params: { limit: 1 }
        });

        // In this app, the workspaceId is derived from the context by the backend
        // but we need it for the ChannelView hook which expects it.
        // For V2, we can often just use the slug if the hook supports it,
        // but let's try to get the actual ID.

        // Let's call an endpoint that returns workspace details
        const channelsRes = await axios.get(`/api/v2/workspaces/${workspaceSlug}/channels`, {
          headers: authHeader
        });

        const channels = channelsRes.data.channels || [];
        // Extract workspaceId from any channel (they all share the same workspace)
        const workspaceId = channels.length > 0 ? channels[0].workspaceId : null;
        setResolvedWorkspaceId(workspaceId);

        // 2. Resolve Channel
        let targetChannelId = "";
        if (channelSlug) {
          const channel = channels.find((c: any) => c.slug === channelSlug || c.id === channelSlug);
          if (channel) {
            targetChannelId = channel.id;
            setResolvedChannelId(channel.id);
          } else {
            setError(`Channel "${channelSlug}" not found`);
            return;
          }
        } else {
          // Default to first public channel if none specified
          const defaultChannel = channels.find((c: any) => !c.isPrivate) || channels[0];
          targetChannelId = defaultChannel?.id;
          setResolvedChannelId(targetChannelId);
        }

        // 3. Handle Context ID resolution if needed
        if (contextId && targetChannelId) {
          try {
            const threadRes = await axios.get(`/api/v2/workspaces/${workspaceSlug}/threads/context/${contextId}`, {
              headers: authHeader
            });
            if (threadRes.data.thread) {
              setResolvedThreadId(threadRes.data.thread.id);
            }
          } catch (threadErr: any) {
            if (threadErr.response?.status !== 404) {
              console.warn("Thread resolution failed", threadErr);
            }
            // If 404, it's fine, it will be created on first message
          }
        }
        // (The ChannelView handles threadId, but we might need to pass it down)

      } catch (err: any) {
        console.error("Resolution Error:", err);
        setError(err.response?.data?.error || "Failed to initialize chat");
      } finally {
        setIsLoading(false);
      }
    }

    resolveSlugs();
  }, [workspaceSlug, channelSlug, token]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-6 text-center bg-background">
        <div className="space-y-2">
          <p className="text-red-500 font-medium">Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !resolvedChannelId) {
    return null; // Layout handled by Suspense parent
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen w-full flex flex-col bg-background border-none shadow-none">
        <ChannelView
          channelId={resolvedChannelId}
          workspaceId={resolvedWorkspaceId || undefined}
          threadId={resolvedThreadId || undefined}
          contextId={contextId || undefined}
          isWidget={true}
        />
        <Toaster position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
