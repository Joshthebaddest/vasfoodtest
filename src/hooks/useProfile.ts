import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore'; // adjust path

export interface ProfileData {
  id: number;
  full_name: string;
  email: string;
  department: string;
  role: string;
  is_verified: number;
}

export interface ProfileResponse {
  data: ProfileData;
  message: string;
}

export const useProfile = () => {
  // read token from Zustand store
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 30 * 60 * 1000, // 30 minutes (user profile rarely changes)
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
    refetchOnWindowFocus: false,
    // Only fetch if token exists in Zustand
    enabled: !!accessToken,
  });
};
