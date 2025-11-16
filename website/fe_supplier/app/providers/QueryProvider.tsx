import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * React Query Provider with optimized defaults for caching
 * 
 * Cache Strategy:
 * - staleTime: 5 minutes - Data considered fresh for 5 mins (no refetch)
 * - cacheTime: 10 minutes - Unused data kept in cache for 10 mins
 * - refetchOnWindowFocus: false - Don't refetch when user returns to tab
 * - retry: 1 - Only retry failed requests once
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 5 minutes (no background refetch)
            staleTime: 5 * 60 * 1000, // 5 minutes
            
            // Unused data removed from cache after 10 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            
            // Don't refetch when window regains focus
            refetchOnWindowFocus: false,
            
            // Don't refetch when component remounts
            refetchOnMount: false,
            
            // Only retry once on failure
            retry: 1,
            
            // Retry delay: 1 second
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
