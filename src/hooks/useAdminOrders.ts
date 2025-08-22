import { useInfiniteQuery } from '@tanstack/react-query';
import { getAdminOrderHistory } from '@/lib/api';

export const useAdminOrderHistory = (fromDate: string, toDate: string, limit: number = 20) => {
  return useInfiniteQuery({
    queryKey: ['adminOrderHistory', fromDate, toDate, limit],
    queryFn: ({ pageParam = 1 }) => {
      console.log(`Fetching page ${pageParam} with limit ${limit}`);
      return getAdminOrderHistory(fromDate, toDate, pageParam, limit);
    },
    getNextPageParam: (lastPage, allPages) => {
      console.log('getNextPageParam called with:', { 
        lastPageDataLength: lastPage?.data?.length, 
        limit, 
        currentPagesCount: allPages.length 
      });
      
      // Check if the API call was successful and we have data
      if (lastPage?.status === "success" && lastPage?.data) {
        // If the returned data length is less than the limit, we've reached the end
        if (lastPage.data.length < limit) {
          console.log('No more pages - reached end');
          return undefined; // No more pages
        }
        // Otherwise, return the next page number
        const nextPage = allPages.length + 1;
        console.log(`Next page will be: ${nextPage}`);
        return nextPage;
      }
      // If the API call failed or no data, stop pagination
      console.log('No more pages - API error or no data');
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!fromDate && !!toDate, // Only run query when both dates are provided
  });
};