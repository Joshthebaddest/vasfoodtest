import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const checkAuth = async () => {
    setIsLoading(true);
    const authenticated = await isAuthenticated();
    setIsAuth(authenticated);
    setIsLoading(false);
  };

  useEffect(() => {
    // Initial auth check on mount
    checkAuth();

    // Refresh on user interaction
    const onUserInteraction = () => {
      checkAuth();
    };

    window.addEventListener("click", onUserInteraction);
    window.addEventListener("keydown", onUserInteraction);
    window.addEventListener("focus", onUserInteraction);

    return () => {
      window.removeEventListener("click", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
      window.removeEventListener("focus", onUserInteraction);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
