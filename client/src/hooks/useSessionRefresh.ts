import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook to automatically refresh session data when component mounts
 * This ensures that user role and permissions are up-to-date
 * 
 * Use this in pages that require fresh permission data (e.g., superadmin pages)
 * 
 * @param enabled - Whether to enable auto-refresh (default: true)
 */
export function useSessionRefresh(enabled = true) {
  const utils = trpc.useUtils();
  
  // Call refreshSession to force fresh DB data
  const { data, isLoading, error, refetch } = trpc.auth.refreshSession.useQuery(undefined, {
    enabled,
    // Don't cache this query - always fetch fresh
    staleTime: 0,
    gcTime: 0, // React Query v5+ uses gcTime instead of cacheTime
  });

  useEffect(() => {
    if (data?.refreshed) {
      // Invalidate all auth queries to force re-fetch with new role
      utils.auth.me.invalidate();
      
      // Invalidate superadmin queries in case role changed
      utils.superadmin.invalidate();
    }
  }, [data, utils]);

  return {
    isRefreshing: isLoading,
    refreshError: error,
    sessionData: data,
    manualRefresh: refetch,
  };
}
