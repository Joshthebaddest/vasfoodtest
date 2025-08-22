import { useQuery } from '@tanstack/react-query';
import { getTodaysOrders } from '@/lib/api';

export const useTodaysOrders = () => {
  return useQuery({
    queryKey: ['todaysOrders'],
    queryFn: getTodaysOrders,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true, // ✅ ADD THIS
  });
};
