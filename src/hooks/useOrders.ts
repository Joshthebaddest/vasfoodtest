import { useQuery } from '@tanstack/react-query';
import { getTodayOrder, getOrderHistory } from '@/lib/api';

// Today's Order Caching Hook
export const useTodayOrder = (userId: number) => {
  return useQuery({
  queryKey: ['todayOrder', userId],
  queryFn: () => getTodayOrder(userId),
  staleTime: 60 * 1000, // 1 minute
  cacheTime: 10 * 60 * 1000, // 10 minutes
  enabled: !!userId,
  retry: 1,
  refetchOnWindowFocus: true,
});

};

// Order History Caching Hook
export const useOrderHistory = (userId: number) => {
  return useQuery({
    queryKey: ['orderHistory', userId],
    queryFn: () => getOrderHistory(userId),
    staleTime: 60 * 60 * 1000, // 1 hour (history doesn't change frequently)
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    enabled: !!userId,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}; 