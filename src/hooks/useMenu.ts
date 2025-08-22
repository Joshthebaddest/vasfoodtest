import { useQuery } from '@tanstack/react-query';
import { getMenu } from '@/lib/api';

export const useMenu = () => {
  return useQuery({
    queryKey: ['menu'],
    queryFn: getMenu,
    staleTime: 60 * 60 * 1000, // 1 hour (menu rarely changes)
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 1,
    refetchOnWindowFocus: false,
  });
}; 