import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/api";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "hr" | "super_admin";
}

export function RoleProtectedRoute({ children, requiredRole }: RoleProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);
  const { toast } = useToast();
  
  // Use TanStack Query for profile data
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const userRole = profile?.data?.role;

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isLoadingProfile && isAuth && userRole && requiredRole) {
      const hasAccess = userRole === requiredRole || userRole === "super_admin";
      
      if (!hasAccess && !hasShownToast) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        setHasShownToast(true);
      }
    }
  }, [isLoading, isLoadingProfile, isAuth, userRole, requiredRole, hasShownToast, toast]);

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const hasAccess = userRole === requiredRole || userRole === "super_admin";
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
} 