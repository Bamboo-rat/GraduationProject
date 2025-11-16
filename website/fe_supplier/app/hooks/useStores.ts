import { useQuery, useQueryClient } from '@tanstack/react-query';
import storeService from '../service/storeService';
import type { StoreResponse, StoreStatus } from '../service/storeService';

/**
 * Params for getMyStores API
 */
export interface GetMyStoresParams {
  page?: number;
  size?: number;
  status?: StoreStatus;
  search?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Query Keys - Centralized for consistency
 */
export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  list: (params: GetMyStoresParams) => [...storeKeys.lists(), params] as const,
  detail: (id: string) => [...storeKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch user's stores with caching
 * 
 * Cache Strategy:
 * - staleTime: 10 minutes (stores change occasionally)
 * - Cached per params (page, status)
 * - Shared across components with same params
 * 
 * Usage:
 * ```tsx
 * const { data: stores, isLoading } = useMyStores({ page: 0, size: 100, status: 'ACTIVE' });
 * ```
 */
export function useMyStores(params: GetMyStoresParams = { page: 0, size: 100, status: 'ACTIVE' }) {
  return useQuery({
    queryKey: storeKeys.list(params),
    queryFn: async () => {
      const response = await storeService.getMyStores(params);
      // Ensure content is an array
      if (response && Array.isArray(response.content)) {
        return response.content;
      }
      console.warn('Stores content is not an array:', response);
      return [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
  });
}

/**
 * Hook to fetch single store by ID
 */
export function useStore(storeId: string) {
  return useQuery({
    queryKey: storeKeys.detail(storeId),
    queryFn: async () => {
      return await storeService.getStoreById(storeId);
    },
    enabled: !!storeId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch ALL active stores (for product creation)
 * Optimized with larger page size to get all stores at once
 */
export function useAllActiveStores() {
  return useQuery({
    queryKey: storeKeys.list({ page: 0, size: 100, status: 'ACTIVE' }),
    queryFn: async () => {
      const response = await storeService.getMyStores({ page: 0, size: 100, status: 'ACTIVE' });
      if (response && Array.isArray(response.content)) {
        return response.content;
      }
      return [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

/**
 * Hook to invalidate stores cache
 */
export function useInvalidateStores() {
  const queryClient = useQueryClient();

  const invalidateStores = () => {
    queryClient.invalidateQueries({ queryKey: storeKeys.all });
  };

  return { invalidateStores };
}
