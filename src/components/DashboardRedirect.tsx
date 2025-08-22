import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, ProfileResponse } from '@/hooks/useProfile';
import { getDefaultRoute } from '@/lib/auth';

export function DashboardRedirect() {
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = useProfile() as
      { data: ProfileResponse | undefined; isLoading: boolean; error: Error | null };

  useEffect(() => {
    if (!isLoading && profile?.data?.role) {
      const defaultRoute = getDefaultRoute(profile.data.role);
      navigate(defaultRoute, { replace: true });
    }
  }, [profile, isLoading, navigate]);

  // Show loading while fetching profile
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if profile fetch failed
  if (error) {
    console.error('DashboardRedirect: Profile fetch error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading profile. Please try again.</p>
          {/*<p className="text-sm text-gray-500 mb-4">Check your internet connection and try refreshing the page.</p>*/}
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return null;
} 