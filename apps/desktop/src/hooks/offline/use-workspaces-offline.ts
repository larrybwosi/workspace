import { useQuery } from "@tanstack/react-query";
import { useWorkspaces as useRemoteWorkspaces } from "@repo/api-client";
import { getCachedWorkspaces, cacheWorkspaces } from "../../lib/db";
import { useEffect, useState } from "react";

export function useWorkspacesWithOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { data: remoteWorkspaces, isLoading: isLoadingRemote, isError } = useRemoteWorkspaces();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Cache data when we receive it from remote
  useEffect(() => {
    if (remoteWorkspaces && remoteWorkspaces.length > 0) {
      cacheWorkspaces(remoteWorkspaces).catch(console.error);
    }
  }, [remoteWorkspaces]);

  const { data: cachedWorkspaces, isLoading: isLoadingCache } = useQuery({
    queryKey: ["cached-workspaces"],
    queryFn: getCachedWorkspaces,
    enabled: isOffline || isError,
  });

  return {
    data: isOffline || isError ? cachedWorkspaces : remoteWorkspaces,
    isLoading: isOffline || isError ? isLoadingCache : isLoadingRemote,
    isOffline,
  };
}
