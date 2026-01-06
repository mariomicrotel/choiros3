import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface TenantRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that ensures user has tenant context
 * Redirects to home if no organization is found
 */
export default function TenantRoute({ children }: TenantRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If user is loaded and has no organization, redirect to home
    if (!loading && user && !user.organization) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no organization, show loading (will redirect via useEffect)
  if (!user?.organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
